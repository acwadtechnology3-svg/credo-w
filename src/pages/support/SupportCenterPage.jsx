import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import {
  getMyTickets,
  getTicket,
  createTicket,
  sendSupportMessage,
  supportAiAssist,
  uploadSupportFile,
  getSupportUnread,
} from '../../api/support.api'
import { SUPPORT_CATEGORIES, TICKET_STATUS, PRIORITY_LABELS } from '../../support/constants'
import SupportAuthGate from '../../support/components/SupportAuthGate'
import SupportCategoryPicker from '../../support/components/SupportCategoryPicker'
import SupportQuickMessages from '../../support/components/SupportQuickMessages'
import { getCategoryById } from '../../support/constants'
import Icon from '../../components/ui/Icon'
import { toast } from '../../components/shared/Toast'
import '../../support/styles/support.css'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ar-EG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageBubble({ msg }) {
  const role = msg.sender_role || 'user'
  const isUser = role === 'user'
  const meta = msg.metadata || {}
  return (
    <div className={`support-msg ${isUser ? 'user' : role}`}>
      {msg.reply_to_id && (
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>↩ رد</div>
      )}
      {msg.message_type === 'image' && meta.file_url ? (
        <a href={meta.file_url} target="_blank" rel="noreferrer">
          <img src={meta.file_url} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </a>
      ) : (
        <div>{msg.body}</div>
      )}
      <div style={{ fontSize: 10, opacity: 0.55, marginTop: 6 }}>{formatTime(msg.created_at)}</div>
    </div>
  )
}

export default function SupportCenterPage({ previewMode = false }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const messagesEndRef = useRef(null)
  const fileRef = useRef(null)

  const [view, setView] = useState('hub')
  const [category, setCategory] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [aiText, setAiText] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [typing, setTyping] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [replyTo, setReplyTo] = useState(null)

  const canSend = isAuthenticated && !previewMode

  const { data: tickets = [] } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: getMyTickets,
    enabled: canSend,
  })

  const { data: ticketDetail, refetch: refetchTicket } = useQuery({
    queryKey: ['support-ticket', selectedId],
    queryFn: () => getTicket(selectedId),
    enabled: !!selectedId && canSend,
    refetchInterval: selectedId ? 8000 : false,
  })

  const { data: unreadData } = useQuery({
    queryKey: ['support-unread'],
    queryFn: getSupportUnread,
    enabled: canSend,
    refetchInterval: 20000,
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const cat = params.get('category')
    const ticket = params.get('ticket')
    if (cat) setCategory(cat)
    if (ticket) {
      setSelectedId(ticket)
      setView('chat')
      setMobileShowChat(true)
    }
  }, [location.search])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticketDetail?.messages])

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
      setSelectedId(data.ticket.id)
      setView('chat')
      setMobileShowChat(true)
      setDraft('')
      toast.success('تم فتح تذكرة الدعم')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'فشل إنشاء التذكرة'),
  })

  const sendMutation = useMutation({
    mutationFn: ({ id, body }) =>
      sendSupportMessage(id, {
        body,
        reply_to_id: replyTo,
        message_type: 'text',
      }),
    onSuccess: () => {
      setDraft('')
      setReplyTo(null)
      refetchTicket()
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
      qc.invalidateQueries({ queryKey: ['support-unread'] })
    },
  })

  const aiMutation = useMutation({
    mutationFn: () => supportAiAssist({ message: aiText, category }),
    onSuccess: (res) => {
      setAiResult(res)
      setTyping(false)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }) => {
      const reader = new FileReader()
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          uploadSupportFile(id, {
            file_base64: reader.result,
            file_name: file.name,
            mime_type: file.type,
          })
            .then(resolve)
            .catch(reject)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },
    onSuccess: () => {
      refetchTicket()
      toast.success('تم رفع الملف')
    },
  })

  const handleAiAsk = () => {
    if (!aiText.trim()) return
    setTyping(true)
    aiMutation.mutate()
  }

  const handleEscalate = () => {
    if (!canSend) return
    createMutation.mutate({
      department: category || 'administration',
      message: aiText || draft || 'طلب تصعيد من Credo AI',
      subject: 'تصعيد من المساعد الذكي',
      context: { page: location.pathname },
      escalateFromAi: true,
    })
  }

  const filteredTickets = tickets.filter((t) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      t.subject?.toLowerCase().includes(s) ||
      t.ticket_number?.toLowerCase().includes(s)
    )
  })

  const selectedTicket = ticketDetail?.ticket
  const messages = ticketDetail?.messages || []
  const catMeta = SUPPORT_CATEGORIES.find((c) => c.id === (category || selectedTicket?.department))

  const startNewTicket = () => {
    if (!canSend) return
    if (!category) {
      toast.error('اختر نوع الدعم أولاً')
      return
    }
    const msg = draft.trim() || aiText.trim()
    if (msg.length < 3) {
      toast.error('اكتب وصف المشكلة')
      return
    }
    createMutation.mutate({
      department: category,
      message: msg,
      subject: msg.slice(0, 80),
      context: { page: location.pathname },
    })
  }

  if (!canSend) {
    return (
      <div className="support-root">
        <div style={{ padding: '16px 0' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>مركز دعم Credo W</h1>
          <p style={{ color: '#a78bfa', fontSize: 14, marginBottom: 16 }}>
            تواصل مع فريق الإدارة والدعم الذكي — معاينة الواجهة
          </p>
        </div>
        <SupportCategoryPicker selected={category} onSelect={setCategory} disabled />
        <div className="support-layout" style={{ marginTop: 16, opacity: 0.85 }}>
          <div className="support-sidebar">
            <div className="support-sidebar-header">
              <input className="support-search" placeholder="بحث..." disabled />
            </div>
            <div className="support-ticket-list">
              <div style={{ padding: 16, color: '#64748b', fontSize: 13 }}>لا توجد محادثات (معاينة)</div>
            </div>
          </div>
          <div className="support-chat-panel">
            <SupportAuthGate />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="support-root">
      <div style={{ padding: '8px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>مركز دعم Credo W</h1>
          <p style={{ color: '#a78bfa', fontSize: 13, margin: '4px 0 0' }}>
            دعم ذكي · تواصل مباشر مع الإدارة
            {(unreadData?.count || 0) > 0 && (
              <span style={{ marginInlineStart: 8, color: '#f472b6' }}>
                ({unreadData.count} غير مقروء)
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          className="support-send-btn"
          onClick={() => {
            setView('hub')
            setSelectedId(null)
            setMobileShowChat(false)
          }}
        >
          + تذكرة جديدة
        </button>
      </div>

      {view === 'hub' && !selectedId && (
        <div className="support-hub">
          <SupportCategoryPicker
            selected={category}
            onSelect={(id) => {
              setCategory(id)
              setDraft('')
              setAiText('')
              if (id === 'credo_ai') setView('hub')
            }}
          />

          {category === 'credo_ai' && (
            <div className="support-ai-panel support-ai-panel--featured">
              <div className="support-ai-panel-head">
                <span className="support-ai-panel-icon">
                  <Icon name="support" size={20} />
                </span>
                <div>
                  <div className="support-ai-panel-title">مساعد Credo AI</div>
                  <div className="support-ai-panel-sub">إجابة فورية — إن لم تكفِ، صعّد للإدارة</div>
                </div>
              </div>
              <SupportQuickMessages
                categoryId="credo_ai"
                disabled={!canSend}
                onPick={(msg) => {
                  setAiText(msg)
                  setDraft(msg)
                }}
              />
              <textarea
                className="support-input"
                rows={2}
                placeholder="صف مشكلتك — قد نحلها فوراً..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
              />
              <div className="support-ai-panel-actions">
                <button type="button" className="support-send-btn" onClick={handleAiAsk} disabled={aiMutation.isPending}>
                  {aiMutation.isPending ? 'جاري التحليل...' : 'اسأل AI'}
                </button>
                <button type="button" className="support-btn-ghost" onClick={handleEscalate}>
                  تصعيد للإدارة
                </button>
              </div>
              {typing && <div className="support-typing">Credo AI يكتب...</div>}
              {aiResult?.answer && (
                <div className="support-msg ai" style={{ marginTop: 12 }}>
                  {aiResult.answer}
                  {aiResult.confidence > 0.5 && (
                    <div style={{ fontSize: 11, marginTop: 6 }}>ثقة: {Math.round(aiResult.confidence * 100)}%</div>
                  )}
                </div>
              )}
            </div>
          )}

          {category && category !== 'credo_ai' && (
            <div className="support-new-ticket-panel">
              <div className="support-new-ticket-head">
                <span
                  className="support-new-ticket-dept"
                  style={{ '--cat-color': getCategoryById(category)?.color }}
                >
                  <Icon name={getCategoryById(category)?.icon || 'support'} size={18} />
                </span>
                <div>
                  <div className="support-new-ticket-title">فتح تذكرة — {getCategoryById(category)?.label}</div>
                  <div className="support-new-ticket-sub">اختر رسالة جاهزة أو اكتب تفاصيلك</div>
                </div>
              </div>
              <SupportQuickMessages
                categoryId={category}
                disabled={!canSend}
                onPick={(msg) => setDraft(msg)}
              />
              <textarea
                className="support-input"
                rows={3}
                placeholder="صف المشكلة أو اختر رسالة جاهزة أعلاه..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                type="button"
                className="support-send-btn support-send-btn--wide"
                onClick={startNewTicket}
                disabled={createMutation.isPending || !category}
              >
                {createMutation.isPending ? 'جاري الفتح...' : 'فتح محادثة دعم'}
              </button>
            </div>
          )}

          {!category && (
            <p className="support-hub-hint">
              <Icon name="support" size={16} />
              اختر نوع الطلب من البطاقات أعلاه لعرض الرسائل الجاهزة وبدء المحادثة
            </p>
          )}
        </div>
      )}

      <div
        className={`support-layout${mobileShowChat ? ' hide-list' : ''}${!mobileShowChat && selectedId ? '' : ''}`}
      >
        <div className="support-sidebar">
          <div className="support-sidebar-header">
            <input
              className="support-search"
              placeholder="بحث في المحادثات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="support-ticket-list">
            {filteredTickets.length === 0 ? (
              <p style={{ padding: 16, fontSize: 13, color: '#64748b' }}>لا توجد تذاكر بعد</p>
            ) : (
              filteredTickets.map((t) => {
                const st = TICKET_STATUS[t.status] || TICKET_STATUS.open
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`support-ticket-item${selectedId === t.id ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedId(t.id)
                      setView('chat')
                      setMobileShowChat(true)
                      navigate(`/support?ticket=${t.id}`, { replace: true })
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.ticket_number || 'تذكرة'}</span>
                      {(t.unread_user || 0) > 0 && (
                        <span className="support-fab-badge" style={{ position: 'static' }}>
                          {t.unread_user}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{t.subject || t.message?.slice(0, 40)}</div>
                    <div style={{ fontSize: 11, color: st.color, marginTop: 4 }}>{st.label}</div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="support-chat-panel">
          {!selectedId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              اختر محادثة أو أنشئ تذكرة جديدة
            </div>
          ) : (
            <>
              <div className="support-chat-header">
                <button
                  type="button"
                  className="support-mobile-back support-icon-btn"
                  style={{ display: 'var(--support-mobile-back, none)' }}
                  onClick={() => setMobileShowChat(false)}
                  aria-label="رجوع"
                >
                  <Icon name="arrow-right" size={18} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{selectedTicket?.ticket_number}</div>
                  <div style={{ fontSize: 12, color: '#a78bfa' }}>{selectedTicket?.subject}</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--sp-border)',
                    color: catMeta?.color || '#a78bfa',
                  }}
                >
                  {PRIORITY_LABELS[selectedTicket?.priority] || 'متوسطة'}
                </span>
                <span style={{ fontSize: 11, color: TICKET_STATUS[selectedTicket?.status]?.color }}>
                  {TICKET_STATUS[selectedTicket?.status]?.label || selectedTicket?.status}
                </span>
              </div>

              <div className="support-messages">
                {messages.map((m) => (
                  <div key={m.id} onContextMenu={(e) => { e.preventDefault(); setReplyTo(m.id) }}>
                    <MessageBubble msg={m} />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {replyTo && (
                <div style={{ padding: '4px 16px', fontSize: 12, color: '#a78bfa' }}>
                  رد على رسالة · <button type="button" onClick={() => setReplyTo(null)}>إلغاء</button>
                </div>
              )}

              <div className="support-compose">
                <div className="support-compose-row">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f && selectedId) uploadMutation.mutate({ id: selectedId, file: f })
                      e.target.value = ''
                    }}
                  />
                  <button type="button" className="support-icon-btn" onClick={() => fileRef.current?.click()} aria-label="رفع">
                    <Icon name="shop" size={18} />
                  </button>
                  <textarea
                    className="support-input"
                    rows={1}
                    placeholder="اكتب رسالتك..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (draft.trim()) sendMutation.mutate({ id: selectedId, body: draft })
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="support-send-btn"
                    disabled={!draft.trim() || sendMutation.isPending}
                    onClick={() => sendMutation.mutate({ id: selectedId, body: draft })}
                  >
                    إرسال
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
