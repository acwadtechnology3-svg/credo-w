import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Icon from '../../../components/ui/Icon'
import { getPublicPackages } from '../../../api/public.api'
import { useAuthStore } from '../../../store/authStore'

function PackagesSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="card" style={{ padding: 28, minHeight: 420 }}>
          <div style={{ height: 22, width: '50%', borderRadius: 6, background: 'var(--surface-2)', marginBottom: 20 }} />
          <div style={{ height: 44, width: '70%', borderRadius: 8, background: 'var(--surface-2)', marginBottom: 24 }} />
          <div style={{ height: 48, borderRadius: 10, background: 'var(--surface-2)' }} />
        </div>
      ))}
    </div>
  )
}

function packageFeatures(pkg) {
  const commission = Number(pkg.direct_commission_egp) || 0
  const bv = Number(pkg.bv_points) || 0
  const lines = [
    commission > 0 ? `عمولة مباشرة ${commission.toLocaleString('en-US')} ج.م` : null,
    bv > 0 ? `${bv} نقطة BV` : null,
    pkg.description || null,
    'وصول للمتجر والأكاديمية',
    'دعم فني · API',
  ].filter(Boolean)
  return lines
}

export default function PackagesSection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: packages, isLoading } = useQuery({
    queryKey: ['public-packages'],
    queryFn: getPublicPackages,
  })

  const list = packages || []
  const popularIndex = list.length >= 2 ? 1 : list.length === 1 ? 0 : -1

  return (
    <section id="packages" style={{ padding: '80px 32px', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="pill" style={{ marginBottom: 16 }}>
            الباقات
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 12 }}>
            أسعار شفّافة. <span className="gradient-text">لا مفاجآت</span>.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 560, margin: '0 auto' }}>
            اختر باقتك حسب حجم عملياتك. التحديث متاح في أي وقت.
          </p>
        </div>

        {isLoading ? (
          <PackagesSkeleton />
        ) : list.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
            لا توجد باقات نشطة حالياً.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {list.map((pkg, index) => {
              const popular = index === popularIndex
              const price = Number(pkg.price_egp) || 0
              const features = packageFeatures(pkg)
              const cta = isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className={`btn ${popular ? 'btn-primary' : ''} btn-lg`}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 22, textDecoration: 'none' }}
                >
                  لوحة التحكم
                  <Icon name="arrow-left" size={13} />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className={`btn ${popular ? 'btn-primary' : ''} btn-lg`}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 22, textDecoration: 'none' }}
                >
                  اختر {pkg.name}
                  <Icon name="arrow-left" size={13} />
                </Link>
              )

              return (
                <div
                  key={pkg.id}
                  className={popular ? 'card-elevated' : 'card'}
                  style={{
                    padding: 28,
                    position: 'relative',
                    overflow: 'hidden',
                    ...(popular && {
                      border: '1px solid var(--line-purple)',
                      boxShadow: 'var(--elev-glow)',
                    }),
                  }}
                >
                  {popular && (
                    <div
                      style={{
                        position: 'absolute',
                        insetInlineEnd: -50,
                        top: -50,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(196,184,255,0.18), transparent)',
                        filter: 'blur(40px)',
                      }}
                    />
                  )}
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                      }}
                    >
                      <div className="font-display" style={{ fontSize: 22, fontWeight: 800 }}>
                        {pkg.name}
                      </div>
                      {popular && (
                        <span className="pill info" style={{ fontSize: 10 }}>
                          <Icon name="flame" size={10} />
                          الأكثر شيوعاً
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 16, marginBottom: 22 }}>
                      <span
                        className="font-num"
                        style={{
                          fontSize: 44,
                          fontWeight: 800,
                          color: popular ? 'var(--lavender)' : 'var(--text-1)',
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {price.toLocaleString('en-US')}
                      </span>
                      <span style={{ color: 'var(--text-3)', fontSize: 13 }}>ج.م · مرة واحدة</span>
                    </div>

                    {cta}

                    <div
                      style={{
                        borderTop: '1px solid var(--line)',
                        paddingTop: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 11,
                      }}
                    >
                      {features.map((f) => (
                        <div key={f} style={{ display: 'flex', gap: 10, fontSize: 12.5, alignItems: 'flex-start' }}>
                          <Icon
                            name="check"
                            size={14}
                            strokeWidth={2.2}
                            style={{
                              color: popular ? 'var(--lavender)' : 'var(--success)',
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          />
                          <span style={{ color: 'var(--text-2)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          className="card-elevated"
          style={{
            marginTop: 16,
            padding: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            position: 'relative',
            overflow: 'hidden',
            borderColor: 'var(--line-purple)',
          }}
        >
          <div
            className="glow-blob"
            style={{
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(123,108,246,0.12), transparent)',
              insetInlineEnd: '0%',
              top: '-50%',
              filter: 'blur(50px)',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--info-soft)',
                border: '1px solid var(--info-edge)',
                fontSize: 10,
                color: 'var(--lavender)',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <Icon name="briefcase" size={10} />
              ENTERPRISE
            </div>
            <div className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
              هل لديك شبكة بأكثر من 10,000 عضو؟
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 600 }}>
              تواصل مع فريق المبيعات لباقة مخصّصة تشمل White-label، API limits مخصّصة، SAML SSO، وضمانات SLA متقدّمة.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, position: 'relative', flexWrap: 'wrap' }}>
            <button type="button" className="btn">
              <Icon name="calendar" size={12} />
              احجز عرضاً
            </button>
            <button type="button" className="btn btn-primary">
              تواصل مع المبيعات
              <Icon name="arrow-left" size={12} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
