import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllTickets,
  getTicket,
  sendSupportMessage,
  updateSupportTicket,
  getUserSupportContext,
} from '../../api/support.api'
import { TICKET_STATUS, PRIORITY_LABELS, CANNED_REPLIES, SUPPORT_CATEGORIES } from '../../support/constants'
import Icon from '../../components/ui/Icon'
import { toast } from '../../components/shared/Toast'
import '../../support/styles/support.css'

export default function AdminSupportPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [showContext, setShowContext] = useState(false)

  const { data: tickets = [] } = useQuery({
    queryKey: ['admin-support-tickets', filterStatus, filterDept, search],
    queryFn: () =>
      getAllTickets({
        status: filterStatus || undefined,
        department: filterDept || undefined,
        search: search || undefined,
      }),
    refetchInterval: 10000,
  })

  const { data: detail, refetch } = useQuery({
    queryKey: ['admin-support-ticket', selectedId],
    queryFn: () => getTicket(selectedId),
    enabled: !!selectedId,
    refetchInterval: 5000,
  })

  const { data: userCtx } = useQuery({
    queryKey: ['support-user-ctx', detail?.ticket?.user_id],
    queryFn: () => getUserSupportContext(detail.ticket.user_id),
    enabled: showContext && !!detail?.ticket?.user_id,
  })

  const sendMutation = useMutation({
    mutationFn: () => sendSupportMessage(selectedId, { body: reply, message_type: 'text' }),
    onSuccess: () => {
      setReply('')
      refetch()
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] })
      toast.success('تم الإرسال')
    },
  })

  const patchMutation = useMutation({
    mutationFn: (body) => updateSupportTicket(selectedId, body),
    onSuccess: () => {
      refetch()
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] })
    },
  })

  const ticket = detail?.ticket
  const messages = (detail?.messages || []).filter((m) => !m.is_internal)

  return (
    <div className="support-root" style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>إدارة الدعم والتذاكر</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="support-search"
          style={{ maxWidth: 200 }}
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="support-search"
          style={{ maxWidth: 140 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">كل الحالات</option>
          {Object.entries(TICKET_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          className="support-search"
          style={{ maxWidth: 160 }}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">كل الأقسام</option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="support-admin-layout">
        <div className="support-sidebar" style={{ borderRadius: 12, maxHeight: '75vh' }}>
          <div className="support-ticket-list">
            {tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`support-ticket-item${selectedId === t.id ? ' active' : ''}`}
                onClick={() => setSelectedId(t.id)}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>{t.ticket_number}</div>
                <div style={{ fontSize: 11 }}>{t.users?.username}</div>
                <div style={{ fontSize: 11, color: '#a78bfa' }}>
                  {(t.unread_admin || 0) > 0 ? `🔴 ${t.unread_admin}` : ''} {t.subject?.slice(0, 30)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="support-chat-panel" style={{ borderRadius: 12, border: '1px solid var(--sp-border)' }}>
          {!ticket ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>اختر تذكرة</div>
          ) : (
            <>
              <div className="support-chat-header">
                <div>
                  <strong>{ticket.ticket_number}</strong> — {ticket.users?.username}
                  <div style={{ fontSize: 12 }}>{ticket.subject}</div>
                </div>
                <select
                  className="support-search"
                  style={{ width: 120 }}
                  value={ticket.status}
                  onChange={(e) => patchMutation.mutate({ status: e.target.value })}
                >
                  {Object.keys(TICKET_STATUS).map((k) => (
                    <option key={k} value={k}>
                      {TICKET_STATUS[k].label}
                    </option>
                  ))}
                </select>
                <select
                  className="support-search"
                  style={{ width: 100 }}
                  value={ticket.priority}
                  onChange={(e) => patchMutation.mutate({ priority: e.target.value })}
                >
                  {Object.keys(PRIORITY_LABELS).map((k) => (
                    <option key={k} value={k}>
                      {PRIORITY_LABELS[k]}
                    </option>
                  ))}
                </select>
                <button type="button" className="support-icon-btn" onClick={() => setShowContext((s) => !s)}>
                  سياق
                </button>
              </div>
              <div className="support-messages" style={{ maxHeight: 400 }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`support-msg ${m.sender_role === 'user' ? 'user' : 'staff'}`}
                  >
                    {m.body}
                    <div style={{ fontSize: 10, opacity: 0.5 }}>{new Date(m.created_at).toLocaleString('ar-EG')}</div>
                  </div>
                ))}
              </div>
              <div className="support-admin-canned">
                <span className="support-admin-canned-label">ردود جاهزة</span>
                <div className="support-admin-canned-chips">
                  {CANNED_REPLIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="support-admin-canned-chip"
                      onClick={() => setReply(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="support-compose">
                <div className="support-compose-row">
                  <textarea
                    className="support-input"
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="رد الإدارة..."
                  />
                  <button
                    type="button"
                    className="support-send-btn"
                    disabled={!reply.trim()}
                    onClick={() => sendMutation.mutate()}
                  >
                    رد
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {showContext && ticket && (
          <div
            className="support-sidebar"
            style={{ borderRadius: 12, fontSize: 12, padding: 12, maxHeight: '75vh', overflow: 'auto' }}
          >
            <h3 style={{ marginBottom: 8 }}>سياق المستخدم</h3>
            {userCtx ? (
              <pre style={{ whiteSpace: 'pre-wrap', color: '#c4b8ff', fontSize: 11 }}>
                {JSON.stringify(userCtx, null, 2)}
              </pre>
            ) : (
              <p>جاري التحميل...</p>
            )}
            <a
              href={`/admin/users/${ticket.user_id}`}
              style={{ color: '#a78bfa', fontSize: 12, marginTop: 12, display: 'block' }}
            >
              ملف المستخدم →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
