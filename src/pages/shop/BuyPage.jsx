import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getProducts, addToCart } from '../../api/shop.api'
import { getProductImageUrl } from '../../utils/productImage'
import { toast } from '../../components/shared/Toast'

const CATEGORIES = [
  'ALL',
  'LICENSES',
  'PACKAGES',
  'VOUCHERS',
  'RZN_BEAUTY',
  'DEETS',
  'QUICK_COACH',
  'ELEVATE',
]

export default function BuyPage() {
  const [category, setCategory] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', category],
    queryFn: () => getProducts({ category }),
  })

  const addMutation = useMutation({
    mutationFn: (pid) => addToCart(pid, 1),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
      toast.success('تمت الإضافة إلى السلة!')
    },
  })

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>المتجر</h2>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: category === cat ? '500' : '400',
              background: category === cat ? '#534AB7' : '#f5f5f5',
              color: category === cat ? '#fff' : '#555',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div>جاري التحميل...</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {(data?.data || []).map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(p)}
            >
              <img
                src={getProductImageUrl(p)}
                alt={p.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
              <div style={{ padding: '12px' }}>
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '4px',
                    color: '#111',
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#534AB7' }}>
                  EGP {parseFloat(p.price_egp).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  (Incl. 14% Tax) | BV: {p.bv_points}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setSelected(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelected(null)}
          role="presentation"
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <img
              src={getProductImageUrl(selected)}
              alt={selected.name}
              style={{
                width: '100%',
                height: '140px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            />
            <h3 style={{ fontWeight: '600', marginBottom: '8px', color: '#111' }}>
              {selected.name}
            </h3>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
              {selected.description}
            </p>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
              BV Points: <strong>{selected.bv_points}</strong>
            </div>
            <div
              style={{ fontSize: '16px', fontWeight: '600', color: '#534AB7', marginBottom: '16px' }}
            >
              EGP {parseFloat(selected.price_egp).toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  addMutation.mutate(selected.id)
                  setSelected(null)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#534AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                أضف إلى السلة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
