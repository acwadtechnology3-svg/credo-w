import { motion } from 'framer-motion'
import ProfileStatCard from '../ProfileStatCard'
import ProfileSocialTab from './ProfileSocialTab'

export default function ProfileOverviewTab({ hub, profileForm, setProfileForm, onSave, saving, onRefresh }) {
  const scores = hub?.scores || {}
  const f = profileForm || {}

  return (
    <motion.div
      className="pi-panel"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="pi-stat-grid" style={{ marginBottom: 20 }}>
        <ProfileStatCard label="Power Score" value={scores.power?.toLocaleString() ?? 0} accent="var(--purple-bright)" delay={0} />
        <ProfileStatCard label="Network Score" value={scores.network?.toLocaleString() ?? 0} accent="var(--electric)" delay={0.05} />
        <ProfileStatCard label="Referral Score" value={scores.referral?.toLocaleString() ?? 0} accent="var(--lavender)" delay={0.1} />
        <ProfileStatCard label="Team BV" value={Math.round(scores.team_contribution || 0)} accent="var(--pi-gold)" delay={0.15} />
      </div>

      <div className="pi-glass" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
          Identity Details
        </h3>
        {[
          { label: 'Username', value: hub?.user?.username, readonly: true },
          { label: 'Email', value: hub?.user?.email, readonly: true },
          { label: 'National ID', value: hub?.user?.national_id, readonly: true },
        ].map((field) => (
          <div key={field.label} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
              {field.label}
            </label>
            <input className="pi-form-input" value={field.value || ''} readOnly style={{ opacity: 0.7 }} />
          </div>
        ))}
        {[
          { label: 'Full Name', key: 'full_name' },
          { label: 'Phone', key: 'phone' },
          { label: 'Country', key: 'country' },
        ].map((field) => (
          <div key={field.key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
              {field.label}
            </label>
            <input
              className="pi-form-input"
              value={f[field.key] || ''}
              onChange={(e) => setProfileForm((p) => ({ ...p, [field.key]: e.target.value }))}
            />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
            Title
          </label>
          <select
            className="pi-form-input"
            value={f.title || 'Mr'}
            onChange={(e) => setProfileForm((p) => ({ ...p, title: e.target.value }))}
          >
            <option>Mr</option>
            <option>Mrs</option>
            <option>Ms</option>
            <option>Dr</option>
          </select>
        </div>
        <button type="button" className="pi-btn pi-btn-primary" style={{ width: '100%' }} onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Identity'}
        </button>
      </div>

      <div className="pi-glass" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>BV Contribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--side-left-soft)', borderRadius: 12 }}>
            <div className="pi-stat-value" style={{ color: 'var(--side-left)' }}>
              {Math.round(hub?.bv?.sideA || 0)}
            </div>
            <div className="pi-stat-label">Side A BV</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--side-right-soft)', borderRadius: 12 }}>
            <div className="pi-stat-value" style={{ color: 'var(--side-right)' }}>
              {Math.round(hub?.bv?.sideB || 0)}
            </div>
            <div className="pi-stat-label">Side B BV</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12, textAlign: 'center' }}>
          Matching BV: <strong style={{ color: 'var(--text-1)' }}>{Math.round(hub?.bv?.matching || 0)}</strong>
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        <ProfileSocialTab hub={hub} onRefresh={onRefresh} />
      </div>
    </motion.div>
  )
}
