import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart, removeCartItem, checkout } from '../../api/shop.api'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from '../../components/shared/Toast'

export default function CartPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [voucherCode, setVoucherCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['cart'], queryFn: getCart })

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await checkout({ voucher_code: voucherCode || undefined })
      qc.invalidateQueries({ queryKey: ['cart'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`تم الطلب! المرجع: ${result.order.order_ref}`)
      navigate('/shop/orders')
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إتمام الطلب')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return <div style={{ padding: '2rem' }}>جاري التحميل...</div>

  const d = data || {}
  const items = d.items || []

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>السلة</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '12px', fontSize: '13px', color: '#534AB7' }}>
            تفاصيل السلة
          </div>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              <div style={{ fontSize: '14px', marginBottom: '12px' }}>سلتك فارغة.</div>
              <button
                type="button"
                onClick={() => navigate('/shop/buy')}
                style={{
                  background: '#534AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  cursor: 'pointer',
                }}
              >
                ابدأ التسوّق
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>{item.products?.name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    EGP {parseFloat(item.products?.price_egp || 0).toLocaleString()} ×{' '}
                    {item.quantity}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>
                    EGP{' '}
                    {(
                      parseFloat(item.products?.price_egp || 0) * item.quantity
                    ).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(item.id)}
                    style={{
                      background: '#fee',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#c00',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    إزالة
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '16px',
            height: 'fit-content',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '12px', fontSize: '13px', color: '#534AB7' }}>
            ملخص السلة
          </div>
          {items.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>سلتك فارغة.</div>
          ) : (
            <>
              <div
                style={{
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>المجموع الفرعي</span>
                  <span>EGP {d.subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>الضريبة (14%)</span>
                  <span>EGP {d.taxAmount}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: '600',
                    fontSize: '14px',
                    borderTop: '1px solid #eee',
                    paddingTop: '6px',
                  }}
                >
                  <span>الإجمالي</span>
                  <span style={{ color: '#534AB7' }}>EGP {d.total}</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                رصيد C Money:{' '}
                <strong style={{ color: d.cmoneyBalance >= d.total ? '#27500A' : '#c00' }}>
                  EGP {d.cmoneyBalance}
                </strong>
              </div>
              <input
                placeholder="كود الخصم (اختياري)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '10px',
                }}
              />
              {error && (
                <div style={{ color: 'red', fontSize: '12px', marginBottom: '8px' }}>{error}</div>
              )}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || items.length === 0}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: loading ? '#aaa' : '#534AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {loading ? 'جاري المعالجة...' : 'إتمام الطلب'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
