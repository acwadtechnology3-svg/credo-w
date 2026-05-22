import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { updateIdentitySettings } from '../../../../api/profile.api'

export default function ProfileSocialTab({ hub, onRefresh }) {
  const social = hub?.social || {}
  const [copied, setCopied] = useState(false)
  const [isPublic, setIsPublic] = useState(social.is_public ?? false)

  const settingsMut = useMutation({
    mutationFn: updateIdentitySettings,
    onSuccess: () => onRefresh?.(),
  })

  const copyLink = () => {
    navigator.clipboard?.writeText(social.referral_url || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareProfile = () => {
    const url = social.share_slug
      ? `${window.location.origin}/register?ref=${hub?.user?.user_code}`
      : social.referral_url
    if (navigator.share) {
      navigator.share({
        title: `${hub?.user?.full_name} — Credo W`,
        text: 'Join my network on Credo W',
        url,
      })
    } else {
      copyLink()
    }
  }

  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="pi-share-card pi-glass" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Referral Card</h3>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
          Share your code and grow your empire
        </p>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pi-gold)', margin: '12px 0' }}>
          {hub?.user?.user_code}
        </div>
        <div className="pi-qr-placeholder">
          QR · {hub?.user?.user_code}
          <br />
          <span style={{ fontSize: 9 }}>Scan to register</span>
        </div>
        <p
          style={{
            fontSize: 11,
            wordBreak: 'break-all',
            color: 'var(--text-3)',
            marginBottom: 12,
          }}
        >
          {social.referral_url}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="pi-btn pi-btn-primary" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button type="button" className="pi-btn pi-btn-ghost" onClick={shareProfile}>
            Share Profile
          </button>
        </div>
      </div>

      <div className="pi-glass" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Public Profile</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              Show rank, team, and achievements to others
            </div>
          </div>
          <button
            type="button"
            className={`pi-btn ${isPublic ? 'pi-btn-primary' : 'pi-btn-ghost'}`}
            onClick={() => {
              const next = !isPublic
              setIsPublic(next)
              settingsMut.mutate({ is_public: next })
            }}
          >
            {isPublic ? 'Public' : 'Private'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
