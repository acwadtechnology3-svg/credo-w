import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInviteHub,
  createInvitation,
  listInvitations,
} from '../../../../api/invitations.api'
import InvitePremiumCard from '../../../../components/invite/InvitePremiumCard'
import { toast } from '../../../../components/shared/Toast'

const CHANNELS = [
  { id: 'email', label: 'Email Invite', icon: '✉️' },
  { id: 'link', label: 'Share Link', icon: '🔗' },
  { id: 'qr', label: 'QR Invite', icon: '📱' },
  { id: 'card', label: 'Copy Card', icon: '🃏' },
]

const STEPS = ['channel', 'placement', 'customize', 'preview', 'send']

const DEFAULT_MSG =
  "You've been hand-picked for my inner circle. This is a private guild invitation — not a mass referral."

export default function ProfileInviteTab({ hub: profileHub }) {
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [channel, setChannel] = useState('email')
  const [email, setEmail] = useState('')
  const [placement, setPlacement] = useState('AUTO')
  const [message, setMessage] = useState(DEFAULT_MSG)
  const [emoji, setEmoji] = useState('🔥')
  const [theme, setTheme] = useState('valorant')
  const [cardStyle, setCardStyle] = useState('holographic')
  const [previewCard, setPreviewCard] = useState(null)

  const { data: inviteHub, isLoading } = useQuery({
    queryKey: ['invite-hub'],
    queryFn: getInviteHub,
  })

  const { data: listData } = useQuery({
    queryKey: ['invitations-list'],
    queryFn: () => listInvitations({ limit: 12 }),
  })

  const createMut = useMutation({
    mutationFn: createInvitation,
    onSuccess: (data) => {
      setPreviewCard(data.card)
      qc.invalidateQueries({ queryKey: ['invite-hub'] })
      qc.invalidateQueries({ queryKey: ['invitations-list'] })
      if (data.emailError) {
        toast.error(
          `تم إنشاء الدعوة لكن الإيميل لم يُرسل: ${data.emailError}. يمكنك مشاركة الرابط يدوياً.`
        )
      } else {
        toast.success(channel === 'email' ? 'تم إرسال الدعوة بالإيميل!' : 'تم إنشاء رابط الدعوة!')
      }
      setStep(4)
    },
    onError: (e) => {
      if (!e.response) {
        toast.error('تعذّر الاتصال بالسيرفر. تأكد أن npm run dev يعمل.')
        return
      }
      const msg = e.response?.data?.error
      const code = e.response?.data?.code
      if (code === 'DB_TABLE_MISSING') {
        toast.error(
          'جدول الدعوات غير مُنشأ. شغّل member-invitations-bootstrap.sql في Supabase SQL Editor ثم أعد المحاولة.'
        )
        return
      }
      toast.error(msg || 'تعذّر إرسال الدعوة')
    },
  })

  const inviter = inviteHub?.inviter || {
    full_name: profileHub?.user?.full_name,
    username: profileHub?.user?.username,
    rank: profileHub?.user?.ranks?.name || profileHub?.user?.rank?.name,
    team_name: profileHub?.team?.name || 'Your Legion',
    package_label: profileHub?.membership?.label || 'Member',
    profile_image: profileHub?.user?.profile_image,
    user_code: profileHub?.user?.user_code,
  }

  const livePreview = useMemo(() => {
    const code = previewCard?.invitation?.invite_code || 'CREDO-PREVIEW'
    const origin = window.location.origin
    const registerUrl = `${origin}/register?invite=${code}&side=${placement}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(registerUrl)}`
    return {
      inviter,
      invitation: {
        invite_code: code,
        placement_side: placement,
        resolved_side: inviteHub?.treeBalance?.recommendedSide || placement,
        invitation_message: message,
        invite_theme: theme,
        card_style: cardStyle,
        invite_emoji: emoji,
      },
      urls: { registerUrl, landingUrl: `${origin}/invite/${code}`, qrUrl },
    }
  }, [inviter, placement, message, theme, cardStyle, emoji, previewCard, inviteHub])

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Copy failed')
    }
  }

  const shareWhatsApp = () => {
    const url = livePreview.urls.registerUrl
    const text = `${emoji} ${inviter.full_name || inviter.username} invited you to Credo W:\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  const shareTelegram = () => {
    const url = livePreview.urls.registerUrl
    const text = `${emoji} Elite invitation from ${inviter.full_name || inviter.username}`
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener'
    )
  }

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(livePreview.urls.registerUrl)}`,
      '_blank',
      'noopener'
    )
  }

  const handleSend = () => {
    if (channel === 'email' && !email.trim()) {
      toast.error('Enter invitee email')
      return
    }
    createMut.mutate({
      invited_email: channel === 'email' ? email.trim() : `invite+${Date.now()}@invite.credow.local`,
      placement_side: placement,
      invitation_message: message,
      invite_emoji: emoji,
      invite_theme: theme,
      card_style: cardStyle,
      invite_channel: channel,
      send_email: channel === 'email',
    })
  }

  if (isLoading) {
    return (
      <motion.div className="pi-panel invite-module">
        <p style={{ color: 'var(--text-2)' }}>Loading recruitment command…</p>
      </motion.div>
    )
  }

  const stats = inviteHub?.stats || {}
  const balance = inviteHub?.treeBalance || {}

  return (
    <motion.div
      className="pi-panel invite-module"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="invite-hero-banner">
        <div>
          <p className="t-eyebrow" style={{ marginBottom: 4, color: 'var(--gold, #f5c842)' }}>
            RECRUITMENT COMMAND
          </p>
          <h2>🔥 Invite Member</h2>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-2)' }}>
            Guild-grade invitations · Auto-balanced tree placement · Elite onboarding
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Invite streak</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--electric)' }}>
            {stats.invite_streak || 0}🔥
          </div>
        </div>
      </div>

      <div className="invite-stat-row">
        <div className="invite-stat">
          <strong>{stats.invites_sent || 0}</strong>
          <span>Sent</span>
        </div>
        <div className="invite-stat">
          <strong>{stats.invites_opened || 0}</strong>
          <span>Opened</span>
        </div>
        <div className="invite-stat">
          <strong>{stats.invites_clicked || 0}</strong>
          <span>Clicked</span>
        </div>
        <div className="invite-stat">
          <strong>{stats.invites_converted || 0}</strong>
          <span>Joined</span>
        </div>
      </div>

      <div className="pi-glass" style={{ padding: 12, marginBottom: 16, fontSize: 12 }}>
        <strong style={{ color: 'var(--lavender)' }}>Tree balance:</strong> Left {Math.round(balance.sideA || 0)} BV · Right{' '}
        {Math.round(balance.sideB || 0)} BV — Auto recommends{' '}
        <strong>{balance.recommendedSide === 'LEFT' ? 'Left' : 'Right'}</strong> leg
      </div>

      <div className="invite-wizard-steps">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`invite-step-pill ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => setStep(i)}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <div className="pi-glass" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Choose invite channel</h3>
              <div className="invite-channel-grid">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`invite-channel-btn ${channel === c.id ? 'selected' : ''}`}
                    onClick={() => setChannel(c.id)}
                  >
                    <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              <button type="button" className="pi-btn pi-btn-primary" style={{ marginTop: 16 }} onClick={() => setStep(1)}>
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="pi-glass" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Placement side</h3>
              <div className="invite-side-grid">
                {[
                  { id: 'LEFT', ico: '⬅️', label: 'Left' },
                  { id: 'RIGHT', ico: '➡️', label: 'Right' },
                  { id: 'AUTO', ico: '⚡', label: 'Auto' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`invite-side-btn ${placement === s.id ? 'selected' : ''}`}
                    onClick={() => setPlacement(s.id)}
                  >
                    <span className="ico">{s.ico}</span>
                    <strong>{s.label}</strong>
                    {s.id === 'AUTO' && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                        → {balance.recommendedSide || 'LEFT'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" className="pi-btn pi-btn-ghost" onClick={() => setStep(0)}>
                  Back
                </button>
                <button type="button" className="pi-btn pi-btn-primary" onClick={() => setStep(2)}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="pi-glass" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Customize invitation</h3>
              {channel === 'email' && (
                <input
                  className="pi-form-input"
                  type="email"
                  placeholder="invitee@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
              )}
              <textarea
                className="pi-form-input"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ marginBottom: 10, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {['🔥', '⚔️', '👑', '💎', '🏆', '✨'].map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`invite-theme-btn ${emoji === e ? 'selected' : ''}`}
                    onClick={() => setEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Card theme</p>
              <div className="invite-theme-grid" style={{ marginBottom: 12 }}>
                {(inviteHub?.settings?.themes || ['valorant', 'nitro', 'royal', 'cyber']).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`invite-theme-btn ${theme === t ? 'selected' : ''}`}
                    onClick={() => setTheme(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Card style</p>
              <div className="invite-theme-grid">
                {['holographic', 'neon', 'royal', 'minimal'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`invite-theme-btn ${cardStyle === s ? 'selected' : ''}`}
                    onClick={() => setCardStyle(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" className="pi-btn pi-btn-ghost" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="pi-btn pi-btn-primary" onClick={() => setStep(3)}>
                  Preview card →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="invite-preview-layout">
              <div className="pi-glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Live preview</h3>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                  Your recruit sees this elite card — not a generic MLM form.
                </p>
                <InvitePremiumCard card={livePreview} />
                <div className="invite-share-row">
                  <button type="button" className="invite-share-btn" onClick={shareWhatsApp}>
                    WhatsApp
                  </button>
                  <button type="button" className="invite-share-btn" onClick={shareTelegram}>
                    Telegram
                  </button>
                  <button type="button" className="invite-share-btn" onClick={shareFacebook}>
                    Facebook
                  </button>
                  <button
                    type="button"
                    className="invite-share-btn"
                    onClick={() => copyText(livePreview.urls.registerUrl, 'Link')}
                  >
                    Copy link
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="button" className="pi-btn pi-btn-ghost" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="pi-btn pi-btn-primary"
                    onClick={() => setStep(4)}
                  >
                    Ready to send →
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="pi-glass" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                {previewCard ? 'Invitation deployed' : 'Send invitation'}
              </h3>
              {previewCard ? (
                <>
                  <InvitePremiumCard card={previewCard} />
                  <div className="invite-share-row" style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      className="invite-share-btn"
                      onClick={() => copyText(previewCard.urls?.registerUrl, 'Invite link')}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      className="invite-share-btn"
                      onClick={() => copyText(previewCard.invitation?.invite_code, 'Invite code')}
                    >
                      Copy code
                    </button>
                  </div>
                  <button
                    type="button"
                    className="pi-btn pi-btn-ghost"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      setPreviewCard(null)
                      setStep(0)
                      setEmail('')
                    }}
                  >
                    Send another invite
                  </button>
                </>
              ) : (
                <>
                  <InvitePremiumCard card={livePreview} compact />
                  <button
                    type="button"
                    className="pi-btn pi-btn-primary"
                    style={{ marginTop: 16, width: '100%' }}
                    disabled={createMut.isPending}
                    onClick={handleSend}
                  >
                    {createMut.isPending
                      ? 'Deploying…'
                      : channel === 'email'
                        ? '✉️ Send premium email'
                        : '🚀 Generate & share invite'}
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {(inviteHub?.leaderboard?.length > 0 || listData?.data?.length > 0) && (
        <div style={{ marginTop: 24 }}>
          {inviteHub?.leaderboard?.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-2)' }}>
                Top recruiters
              </h3>
              {inviteHub.leaderboard.slice(0, 5).map((r) => (
                <div key={r.rank} className="pi-leaderboard-row">
                  <span className="pi-rank-num">#{r.rank}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.full_name || r.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.conversions} conversions</div>
                  </div>
                  <span style={{ color: 'var(--electric)' }}>{r.streak}🔥</span>
                </div>
              ))}
            </>
          )}

          {listData?.data?.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: '20px 0 10px', color: 'var(--text-2)' }}>
                Recent invitations
              </h3>
              {listData.data.map((inv) => (
                <div key={inv.id} className="invite-list-row">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.invited_email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                      {inv.invite_code} · {inv.placement_side}
                    </div>
                  </div>
                  <span className={`invite-status ${inv.status}`}>{inv.status.replace('_', ' ')}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
