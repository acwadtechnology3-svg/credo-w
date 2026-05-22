import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../../api/shop.api'

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders({ limit: 50 }),
  })

  const statusColor = {
    pending: '#888',
    processing: '#BA7517',
    shipped: '#378ADD',
    delivered: '#27500A',
    cancelled: '#c00',
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>ملخص الطلبات</h2>
      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['الدفع', 'رقم الطلب', 'التاريخ', 'المبلغ', 'المتبقي', 'تاريخ الدفع', 'الحالة'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      color: '#888',
                      fontWeight: '500',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  جاري التحميل...
                </td>
              </tr>
            ) : (data?.data || []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  لا توجد طلبات بعد
                </td>
              </tr>
            ) : (
              (data?.data || []).map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px' }}>✓</td>
                  <td style={{ padding: '8px 12px', fontWeight: '500', color: '#534AB7' }}>
                    {o.order_ref}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '500' }}>
                    EGP {parseFloat(o.total).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>EGP 0</td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        background: '#EAF3DE',
                        color: statusColor[o.status] || '#333',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
