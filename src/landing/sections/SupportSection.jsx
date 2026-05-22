import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SectionHeader from '../components/core/SectionHeader'
import SectionShell from '../components/core/SectionShell'
import { getSupportStats } from '../../api/support.api'
import Icon from '../../components/ui/Icon'
import '../../support/styles/support.css'

export default function SupportSection() {
  const { data: stats } = useQuery({
    queryKey: ['support-public-stats'],
    queryFn: getSupportStats,
    staleTime: 120_000,
    retry: 1,
  })

  const open = stats?.open_tickets ?? 24
  const resolved = stats?.resolved_tickets ?? 1200
  const avgMin = stats?.avg_response_minutes ?? 12

  return (
    <SectionShell id="support-center" glow="purple" beat="دعم 24/7">
      <div className="ld-container support-landing-section">
        <SectionHeader
          eyebrow="Credo Support"
          title="مركز دعم Credo W"
          subtitle="تواصل مع فريق الإدارة والدعم الذكي في أي وقت."
        />

        <div className="support-landing-grid">
          <div>
            <p style={{ color: 'var(--ld-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              ليس روبوت عاماً — نظام دعم آمن للأعضاء: تقني، مالي، وكالات، باقات، وسحب، وتحقق هوية،
              ومساعد AI قبل التصعيد للبشر.
            </p>
            <div style={{ marginBottom: 20 }}>
              <span className="support-stat-pill">
                <Icon name="support" size={14} /> {open}+ تذاكر نشطة
              </span>
              <span className="support-stat-pill">
                <Icon name="trend-up" size={14} /> {resolved}+ تم حلها
              </span>
              <span className="support-stat-pill">
                <Icon name="support" size={14} /> ~{avgMin} دقيقة استجابة
              </span>
            </div>
            <Link
              to="/support"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #5b21b6, #a855f7)',
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              افتح مركز الدعم
            </Link>
          </div>

          <div
            className="support-layout"
            style={{ minHeight: 280, opacity: 0.95, pointerEvents: 'none' }}
          >
            <div className="support-sidebar">
              <div className="support-sidebar-header">
                <div style={{ fontSize: 12, color: '#a78bfa' }}>معاينة مباشرة</div>
              </div>
              <div className="support-ticket-list">
                {['الدعم التقني', 'الدعم المالي', 'Credo AI'].map((label, i) => (
                  <div key={label} className="support-ticket-item" style={{ cursor: 'default' }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>TKT-00000{i + 1}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="support-chat-panel">
              <div className="support-messages" style={{ padding: 12 }}>
                <div className="support-msg ai">مرحباً! أنا Credo AI — كيف أساعدك؟</div>
                <div className="support-msg user">استفسار عن الباقة الذهبية</div>
                <div className="support-msg staff">فريق الإدارة جاهز للرد خلال دقائق.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
