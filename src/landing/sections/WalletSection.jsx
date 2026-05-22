import { Wallet, Gem, ArrowDownToLine, Percent } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'
import { WALLET_FEATURES } from '../data/content'

const ICONS = [Wallet, Gem, ArrowDownToLine, Percent]

export default function WalletSection() {
  return (
    <section className="ld-section">
      <SectionHeader
        eyebrow="المحفظة والمكافآت"
        title="C Money · لؤلؤ · عمولات لحظية"
        titleEn="Wallet & Rewards"
        subtitle="نظام مالي متكامل يدعم السحب، القسائم، ومكافآت الولاء."
        align="center"
      />
      <div className="ld-container">
        <div
          className="ld-glass"
          style={{
            padding: 48,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
            borderRadius: 'var(--ld-r-xl)',
          }}
        >
          {WALLET_FEATURES.map((w, i) => {
            const Icon = ICONS[i]
            return (
              <Reveal key={w.label} delay={i * 0.08}>
                <div style={{ textAlign: 'center' }}>
                  <div className="ld-icon-ring" style={{ margin: '0 auto 16px' }}>
                    <Icon size={22} color="#c4b8ff" />
                  </div>
                  <div className="ld-gradient-text" style={{ fontSize: 22, fontWeight: 800 }}>
                    {w.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ld-text-muted)', marginTop: 8 }}>{w.value}</div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
