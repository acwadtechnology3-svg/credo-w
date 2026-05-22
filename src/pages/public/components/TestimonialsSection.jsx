import Icon from '../../../components/ui/Icon'

const TESTIMONIALS = [
  {
    q: 'انتقلنا من Excel ولوحات يدوية إلى Credo W. وفّر علينا 40 ساعة شهرياً في احتساب العمولات وحدها.',
    n: 'فاطمة عيسى',
    t: 'مديرة شبكة · 2,400 مسوّق',
    avatar: '#7B6CF6',
  },
  {
    q: 'الـ API هو الفارق. ربطنا نظام CRM الخاص بنا في 3 أيام. أعضاؤنا يرون عمولاتهم لحظياً.',
    n: 'محمد طارق',
    t: 'CTO · Helios Marketing',
    avatar: '#6BE4FF',
  },
  {
    q: 'محرّك الـ Carry يعمل بدقّة لم نَرها في أي منصة أخرى. صفر شكاوى من المسوّقين منذ 8 أشهر.',
    n: 'سارة المنصور',
    t: 'COO · Atlas Network',
    avatar: '#FFB23F',
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" style={{ padding: '80px 32px', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="pill" style={{ marginBottom: 14 }}>
            <Icon name="star" size={11} />
            قصص نجاح
          </span>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.025em' }}>
            كيف يستخدمها <span className="gradient-text">قادة الشبكات</span>
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {TESTIMONIALS.map((t) => (
            <div key={t.n} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <Icon key={s} name="star" size={14} style={{ color: 'var(--warning)' }} strokeWidth={1.6} />
                ))}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.65, marginBottom: 24 }}>"{t.q}"</p>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${t.avatar}, ${t.avatar}66)`,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#0A0A0A',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  {t.n[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.t}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
