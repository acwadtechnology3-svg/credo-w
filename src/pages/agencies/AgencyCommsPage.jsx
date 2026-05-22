import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyAgency } from '../../api/agencies.api'
import {
  getAgencyGroupWorkspace,
  getChannelMessages,
  sendGroupMessage,
  uploadGroupFile,
  groupAiAssist,
  deleteGroupMessage,
  getAgencyGroupAnalytics,
  searchAgencyGroup,
} from '../../api/agencyGroups.api'
import { useAuthStore } from '../../store/authStore'
import { useAgencyGroupSocket } from '../../hooks/useAgencyGroupSocket'
import {
  addOptimisticMessage,
  appendMessageToThread,
  removeOptimisticMessage,
  patchMessageDeleted,
  messagesQueryKey,
} from '../../agency-comms/messageCache.js'
import Icon from '../../components/ui/Icon'
import { toast } from '../../components/shared/Toast'
import '../../agency-comms/styles/agency-comms.css'

const CHANNEL_ICONS = {
  main: 'message',
  announcements: 'rank',
  leadership: 'team',
  onboarding: 'academy',
  support: 'support',
  event: 'leads',
  voice: 'wallet',
}

const CARD_TYPES = new Set([
  'system',
  'welcome',
  'ai',
  'onboarding_card',
  'achievement_card',
  'rank_card',
  'package_card',
])

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

function isCardMessage(msg) {
  return CARD_TYPES.has(msg.message_type) || !msg.sender_id
}

function groupChatRows(messages) {
  const rows = []
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (isCardMessage(msg)) {
      rows.push({ type: 'center', messages: [msg] })
      continue
    }
    const prev = messages[i - 1]
    const next = messages[i + 1]
    const samePrev =
      prev &&
      !isCardMessage(prev) &&
      prev.sender_id === msg.sender_id &&
      new Date(msg.created_at) - new Date(prev.created_at) < 120000
    const sameNext =
      next &&
      !isCardMessage(next) &&
      next.sender_id === msg.sender_id &&
      new Date(next.created_at) - new Date(msg.created_at) < 120000

    let tail = 'single'
    if (samePrev && sameNext) tail = 'mid'
    else if (samePrev) tail = 'end'
    else if (sameNext) tail = 'start'

    rows.push({
      type: msg._rowSide || 'chat',
      messages: [msg],
      tail,
      showName: !samePrev && msg._rowSide === 'in',
    })
  }
  return rows
}

function ChatBubble({ msg, tail, isOwn, canDelete, canDeleteForAll, onDelete, canSeeDeleted }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const type = msg.message_type || 'text'
  const meta = msg.metadata || {}
  const deleted = msg.deleted_placeholder
  const adminView = msg._moderation_view && msg.deleted_for_all_at

  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  const tailClass =
    tail === 'start' ? 'tail-start' : tail === 'mid' ? 'tail-mid' : tail === 'end' ? 'tail-end' : ''

  return (
    <div className="agency-comms__bubble-wrap" ref={menuRef}>
      {(canDelete || canDeleteForAll) && !deleted && (
        <button
          type="button"
          className="agency-comms__menu-btn"
          aria-label="خيارات"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
        >
          ⋮
        </button>
      )}
      {menuOpen && (
        <div className="agency-comms__menu">
          <button type="button" onClick={() => { onDelete('self'); setMenuOpen(false) }}>
            حذف لدي
          </button>
          {(canDeleteForAll || isOwn) && (
            <button
              type="button"
              className="danger"
              onClick={() => { onDelete('everyone'); setMenuOpen(false) }}
            >
              حذف للجميع
            </button>
          )}
        </div>
      )}
      <div
        className={`agency-comms__bubble ${tailClass} ${deleted ? 'deleted' : ''} ${adminView ? 'admin-deleted' : ''} ${msg._optimistic ? 'is-pending' : ''}`}
      >
        {adminView && canSeeDeleted && (
          <span className="admin-tag">محذوفة للجميع — عرض إداري</span>
        )}
        {deleted ? (
          <p className="agency-comms__bubble-text">{msg.deleted_label || 'تم حذف هذه الرسالة'}</p>
        ) : type === 'image' && meta.file_url ? (
          <a href={meta.file_url} target="_blank" rel="noreferrer">
            <img src={meta.file_url} alt="" />
          </a>
        ) : (
          <p className="agency-comms__bubble-text">{msg.body}</p>
        )}
        <div className="agency-comms__bubble-foot">
          {msg._optimistic && <span style={{ marginLeft: 4 }}>🕐</span>}
          <span>{formatTime(msg.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function CenterPill({ msg }) {
  return (
    <div className="agency-comms__pill">
      {msg.deleted_placeholder
        ? msg.deleted_label
        : msg.body?.length > 120
          ? `${msg.body.slice(0, 120)}…`
          : msg.body}
    </div>
  )
}

export default function AgencyCommsPage() {
  const userId = useAuthStore((s) => s.user?.id)
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const endRef = useRef(null)
  const fileRef = useRef(null)
  const [channelId, setChannelId] = useState(null)
  const [draft, setDraft] = useState('')
  const [typingLabel, setTypingLabel] = useState('')
  const [mobileChannels, setMobileChannels] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const { data: mine, isLoading: mineLoading } = useQuery({
    queryKey: ['my-agency'],
    queryFn: getMyAgency,
  })

  const agencyId = mine?.agency?.id

  const { data: workspace, isLoading: wsLoading, error: wsError } = useQuery({
    queryKey: ['agency-group-workspace', agencyId],
    queryFn: () => getAgencyGroupWorkspace(agencyId),
    enabled: !!agencyId,
  })

  const channels = workspace?.channels || []
  const activeChannel = channels.find((c) => c.id === channelId) || channels[0]

  useEffect(() => {
    if (!channelId && channels[0]?.id) setChannelId(channels[0].id)
  }, [channels, channelId])

  const { data: thread, isLoading: msgLoading } = useQuery({
    queryKey: messagesQueryKey(agencyId, activeChannel?.id),
    queryFn: () => getChannelMessages(agencyId, activeChannel.id),
    enabled: !!agencyId && !!activeChannel?.id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const { data: analytics } = useQuery({
    queryKey: ['agency-group-analytics', agencyId],
    queryFn: () => getAgencyGroupAnalytics(agencyId),
    enabled: !!agencyId && showAnalytics && workspace?.can_manage,
  })

  const { data: searchData } = useQuery({
    queryKey: ['agency-group-search', agencyId, searchQ],
    queryFn: () => searchAgencyGroup(agencyId, { q: searchQ, type: 'messages' }),
    enabled: !!agencyId && searchQ.length >= 2,
  })

  const sendMut = useMutation({
    mutationFn: (body) => sendGroupMessage(agencyId, activeChannel.id, body),
    onMutate: async (body) => {
      const text = body.body?.trim()
      if (!text || !activeChannel?.id) return {}
      const clientId = `opt-${Date.now()}`
      const optimistic = {
        id: clientId,
        _client_id: clientId,
        _optimistic: true,
        sender_id: userId,
        body: text,
        message_type: body.message_type || 'text',
        created_at: new Date().toISOString(),
        channel_id: activeChannel.id,
        sender: {
          id: userId,
          username: user?.username,
          full_name: user?.full_name,
          profile_image: user?.profile_image,
        },
      }
      setDraft('')
      addOptimisticMessage(qc, agencyId, activeChannel.id, optimistic)
      endRef.current?.scrollIntoView({ behavior: 'auto' })
      return { clientId, text }
    },
    onSuccess: (data, _vars, ctx) => {
      const msg = data?.message
      if (msg && activeChannel?.id) {
        appendMessageToThread(qc, agencyId, activeChannel.id, {
          ...msg,
          _client_id: ctx?.clientId,
          sender: msg.sender || {
            id: userId,
            username: user?.username,
            full_name: user?.full_name,
          },
        })
      }
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.clientId) removeOptimisticMessage(qc, agencyId, activeChannel?.id, ctx.clientId)
      if (ctx?.text) setDraft(ctx.text)
      toast.error(e?.response?.data?.error || 'فشل الإرسال')
    },
  })

  const deleteMut = useMutation({
    mutationFn: ({ messageId, scope }) => deleteGroupMessage(agencyId, messageId, scope),
    onMutate: async ({ messageId, scope }) => {
      patchMessageDeleted(qc, agencyId, activeChannel?.id, messageId, {
        scope,
        deleted_label: scope === 'everyone' ? 'تم حذف هذه الرسالة' : undefined,
      })
      return { messageId, scope }
    },
    onSuccess: (_, { scope }) => {
      toast.success(scope === 'everyone' ? 'تم الحذف للجميع' : 'تم الحذف من عندك')
    },
    onError: (e) => {
      toast.error(e?.response?.data?.error || 'فشل الحذف')
      qc.invalidateQueries({ queryKey: messagesQueryKey(agencyId, activeChannel?.id) })
    },
  })

  const aiMut = useMutation({
    mutationFn: (question) => groupAiAssist(agencyId, activeChannel?.id, question),
    onSuccess: (data) => {
      if (data?.message) appendMessageToThread(qc, agencyId, activeChannel?.id, data.message)
    },
  })

  const uploadMut = useMutation({
    mutationFn: (payload) => uploadGroupFile(agencyId, activeChannel.id, payload),
    onSuccess: (data) => {
      if (data?.message) appendMessageToThread(qc, agencyId, activeChannel?.id, data.message)
    },
  })

  const { emitTyping } = useAgencyGroupSocket(agencyId, activeChannel?.id, {
    onTyping: (p) => {
      if (p.userId !== userId) {
        setTypingLabel('يكتب الآن...')
        setTimeout(() => setTypingLabel(''), 2000)
      }
    },
  })

  const scrollBottom = useCallback((instant = false) => {
    endRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' })
  }, [])

  useEffect(() => {
    scrollBottom(true)
  }, [thread?.messages?.length, scrollBottom])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || !activeChannel) return
    if (activeChannel.is_read_only && !workspace?.can_manage) {
      toast.error('قناة للقراءة فقط — القيادة فقط')
      return
    }
    sendMut.mutate({ body: text, message_type: 'text' })
    scrollBottom(true)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeChannel) return
    const reader = new FileReader()
    reader.onload = () => {
      uploadMut.mutate({
        file_base64: reader.result,
        file_name: file.name,
        mime_type: file.type,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const unreadMap = workspace?.unread_by_channel || {}
  const readOnly = activeChannel?.is_read_only && !workspace?.can_moderate
  const canSeeDeleted = thread?.can_see_deleted || workspace?.can_moderate

  const chatRows = useMemo(() => {
    const raw = thread?.messages || []
    const withSide = raw.map((msg) => ({
      ...msg,
      _rowSide: isCardMessage(msg) ? 'center' : msg.sender_id === userId ? 'out' : 'in',
    }))
    return groupChatRows(withSide)
  }, [thread?.messages, userId])

  if (mineLoading || wsLoading) {
    return (
      <div className="agency-comms locked">
        <p style={{ color: '#8696a0' }}>جاري تحميل المحادثة...</p>
      </div>
    )
  }

  if (!agencyId) {
    return (
      <div className="agency-comms locked">
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h2 style={{ color: '#e9edef' }}>انضم لوكالة أولاً</h2>
          <Link to="/agencies/discover" style={{ color: '#00a884', marginTop: 16, display: 'inline-block' }}>
            اكتشف الوكالات
          </Link>
        </div>
      </div>
    )
  }

  if (wsError?.response?.status === 403) {
    if (wsError.response?.data?.code === 'PACKAGE_REQUIRED') {
      return <Navigate to="/packages" replace />
    }
    return (
      <div className="agency-comms locked">
        <p style={{ color: '#ff6b8a' }}>{wsError.response?.data?.error}</p>
      </div>
    )
  }

  return (
    <div className={`agency-comms ${mobileChannels ? 'mobile-channels-open' : ''}`}>
      <aside className="agency-comms__sidebar">
        <div className="agency-comms__brand">
          {workspace?.agency?.logo_url ? (
            <img src={workspace.agency.logo_url} alt="" />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: workspace?.agency?.primary_color || '#00a884',
              }}
            />
          )}
          <div>
            <h2>{workspace?.agency?.name}</h2>
            <span>محادثة الوكالة</span>
          </div>
        </div>

        <nav className="agency-comms__channels">
          {channels.map((ch) => {
            const unread = unreadMap[ch.id] || 0
            return (
              <button
                key={ch.id}
                type="button"
                className={`agency-comms__channel ${ch.id === activeChannel?.id ? 'active' : ''} ${unread ? 'has-unread' : ''}`}
                onClick={() => {
                  setChannelId(ch.id)
                  setMobileChannels(false)
                }}
              >
                <Icon name={CHANNEL_ICONS[ch.channel_type] || 'message'} size={16} />
                <span>{ch.name}</span>
                <span className="dot" />
                {unread > 0 && <span className="agency-comms__badge">{unread > 9 ? '9+' : unread}</span>}
              </button>
            )
          })}
        </nav>

        {workspace?.can_manage && (
          <div className="agency-comms__analytics">
            <button
              type="button"
              onClick={() => setShowAnalytics((v) => !v)}
              style={{ background: 'transparent', border: 'none', color: '#00a884', cursor: 'pointer', width: '100%', textAlign: 'start' }}
            >
              تحليلات
            </button>
            {showAnalytics && analytics && (
              <div style={{ marginTop: 6 }}>
                <div>نشط: {analytics.active_members}</div>
                <div>رسائل: {analytics.messages_7d}</div>
              </div>
            )}
          </div>
        )}
      </aside>

      <section className="agency-comms__main">
        <header className="agency-comms__header">
          <button type="button" className="agency-comms__mobile-back" onClick={() => setMobileChannels(true)}>
            ☰
          </button>
          <div>
            <h3>{activeChannel?.name}</h3>
            {activeChannel?.is_read_only && <span className="tag">إعلانات</span>}
          </div>
          <div className="agency-comms__toolbar">
            <input
              type="search"
              placeholder="بحث"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
            <button type="button" onClick={() => aiMut.mutate('كيف أبدأ؟')} disabled={aiMut.isPending}>
              AI
            </button>
          </div>
        </header>

        {searchQ.length >= 2 && searchData?.results?.length > 0 && (
          <div style={{ padding: '6px 16px', fontSize: 11, color: '#00a884' }}>
            {searchData.results.length} نتيجة
          </div>
        )}

        <div className="agency-comms__messages">
          {msgLoading && <p style={{ color: '#8696a0', textAlign: 'center', fontSize: 13 }}>تحميل...</p>}
          {chatRows.map((row, idx) => {
            if (row.type === 'center') {
              const msg = row.messages[0]
              return (
                <div key={msg.id} className="agency-comms__row center">
                  <CenterPill msg={msg} />
                </div>
              )
            }
            const msg = row.messages[0]
            const isOwn = msg.sender_id === userId
            const canDelete = isOwn || workspace?.can_moderate
            const canDeleteForAll = isOwn || workspace?.can_manage

            return (
              <div
                key={`${msg.id}-${idx}`}
                className={`agency-comms__row ${isOwn ? 'out' : 'in'}`}
              >
                {row.showName && msg.sender && (
                  <span className="agency-comms__sender-name">
                    {msg.sender.full_name || msg.sender.username}
                  </span>
                )}
                <ChatBubble
                  msg={msg}
                  tail={row.tail}
                  isOwn={isOwn}
                  canDelete={canDelete}
                  canDeleteForAll={canDeleteForAll}
                  canSeeDeleted={canSeeDeleted}
                  onDelete={(scope) => deleteMut.mutate({ messageId: msg.id, scope })}
                />
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        <div className="agency-comms__typing">{typingLabel}</div>

        <div className="agency-comms__composer">
          <input ref={fileRef} type="file" hidden accept="image/*,audio/*,.pdf" onChange={handleFile} />
          <button type="button" className="icon-btn" onClick={() => fileRef.current?.click()}>
            📎
          </button>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              emitTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={readOnly ? 'للقيادة فقط' : 'رسالة'}
            disabled={readOnly || workspace?.is_muted}
            rows={1}
          />
          <button
            type="button"
            className="send-btn"
            onClick={handleSend}
            disabled={!draft.trim() || sendMut.isPending || readOnly || workspace?.is_muted}
            aria-label="إرسال"
          >
            ➤
          </button>
        </div>
      </section>
    </div>
  )
}
