import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getPublicInvite, trackInviteEvent } from '../../api/invitations.api'
import InvitePremiumCard from '../../components/invite/InvitePremiumCard'
import Logo from '../../components/ui/Logo'
import { GlowBg } from '../../components/ui/GlowBg'

export default function InviteLandingPage() {
  const { code } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-invite', code],
    queryFn: () => getPublicInvite(code),
    enabled: !!code,
    retry: false,
  })

  useEffect(() => {
    if (code) trackInviteEvent(code, 'opened').catch(() => {})
  }, [code])

  const handleJoin = () => {
    if (!data?.card?.urls?.registerUrl) return
    trackInviteEvent(code, 'clicked').catch(() => {})
    navigate(
      `/register?invite=${encodeURIComponent(code)}&side=${data.card.invitation?.placement_side || 'AUTO'}`
    )
  }

  return (
    <div className="invite-landing page-enter" dir="ltr">
      <GlowBg />
      <div className="invite-landing-inner" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <Logo to="/" size="lg" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--gold, #f5c842)',
            marginBottom: 8,
          }}
        >
          Private guild invitation
        </motion.p>

        {isLoading && (
          <p style={{ color: 'var(--text-2)' }}>Unlocking your exclusive access…</p>
        )}

        {error && (
          <div className="pi-glass" style={{ padding: 24 }}>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>Invitation unavailable</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
              {error.response?.data?.error || 'This invite may have expired.'}
            </p>
            <Link to="/register" className="pi-btn pi-btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
              Register without invite
            </Link>
          </div>
        )}

        {data?.card && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                marginBottom: 8,
                background: 'linear-gradient(135deg, var(--text-1), var(--lavender))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              You're expected.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>
              {data.card.inviter?.full_name || data.card.inviter?.username} reserved a seat on their elite team.
            </p>

            <InvitePremiumCard card={data.card} />

            <button
              type="button"
              className="pi-btn pi-btn-primary"
              style={{ width: '100%', marginTop: 20, padding: '14px' }}
              onClick={handleJoin}
            >
              Accept invitation →
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 16 }}>
              Already a member? <Link to="/login">Sign in</Link>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
