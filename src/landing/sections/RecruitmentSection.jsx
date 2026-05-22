import { UserPlus, Link2, QrCode } from 'lucide-react'
import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'
import { MagneticLink } from '../components/core/MagneticButton'

export default function RecruitmentSection() {
  return (
    <section className="ld-section">
      <SectionHeader
        eyebrow="الدعوة والانضمام"
        title="ادعُ. انمُ. كرّر."
        titleEn="Recruitment & Invitation Flow"
        subtitle="روابط دعوة، QR، وتتبع referrals — مسار انضمام سلس من أول نقرة."
        align="center"
      />
      <div className="ld-container">
        <div className="ld-cta-banner">
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 32,
              alignItems: 'center',
            }}
          >
            <div>
              <h3 className="ld-heading-lg" style={{ color: '#fff', marginBottom: 12 }}>
                خلي أول خطوة ليك شكلها أقوى
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: 480 }}>
                سجّل خلال دقيقتين، ادعُ أول عضو، وشاهد محرّك العمولات يعمل.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                { icon: UserPlus, label: 'تسجيل سريع' },
                { icon: Link2, label: 'رابط دعوة' },
                { icon: QrCode, label: 'QR فوري' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <Icon size={20} />
                  {label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <MagneticLink to="/register" className="ld-btn-ghost" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                ابدأ الآن
              </MagneticLink>
              <MagneticLink to="/team/new-referral" className="ld-btn-ghost" style={{ color: '#fff' }}>
                إنشاء دعوة
              </MagneticLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
