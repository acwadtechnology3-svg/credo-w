import { motion } from 'framer-motion'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◆' },
  { id: 'team', label: 'Team', icon: '⚔' },
  { id: 'invite', label: 'Invite Member', icon: '🔥' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'wallets', label: 'Wallets', icon: '💎' },
  { id: 'packages', label: 'Packages', icon: '📦' },
  { id: 'activity', label: 'Activity', icon: '📊' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
  { id: 'security', label: 'Security', icon: '🛡' },
]

export default function ProfileTabNav({ active, onChange }) {
  return (
    <>
      <p className="pi-swipe-hint">Swipe tabs →</p>
      <nav className="pi-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`pi-tab ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span style={{ marginInlineEnd: 6, opacity: 0.7 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      {TABS.map(
        (tab) =>
          active === tab.id && (
            <motion.div
              key={tab.id}
              layoutId="pi-tab-indicator"
              style={{ display: 'none' }}
            />
          )
      )}
    </>
  )
}
