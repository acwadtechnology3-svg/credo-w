import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminProducts, deleteAdminProduct, getAdminCategories } from '../../api/adminProducts.api'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, categoryFilter],
    queryFn: () => getAdminProducts({ search, category_id: categoryFilter, limit: 30 }),
  })
  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  return (
    <div className="admin-panel admin-form-page page-enter">
      <div className="admin-form-page__header">
        <h2 className="admin-panel__title">Products Management</h2>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => navigate('/admin/products/new')}
        >
          + Add Product
        </button>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          className="admin-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          className="admin-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="">All Categories</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="admin-card" style={{ overflow: 'auto' }}>
        <table className="admin-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              {['Image', 'Name', 'Category', 'Price', 'BV', 'Stock', 'Status', 'Actions'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center' }}>
                  <span className="admin-hint">Loading...</span>
                </td>
              </tr>
            ) : (
              (data?.data || []).map((p) => {
                const primaryImg =
                  p.product_images?.find((i) => i.is_primary)?.image_url || p.image_url
                const lowStock =
                  p.stock !== -1 && p.stock <= (p.low_stock_alert || 10)
                return (
                  <tr key={p.id}>
                    <td>
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={p.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            background: '#f5f5f5',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                          }}
                        >
                          📦
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '500', maxWidth: '200px', color: 'var(--text-1)' }}>
                      <div>{p.name}</div>
                      {p.is_package && <span className="admin-pill admin-pill--purple">Package</span>}
                    </td>
                    <td>{p.categories?.name || '—'}</td>
                    <td style={{ fontWeight: '600', color: 'var(--lavender)' }}>
                      EGP {parseFloat(p.price_egp).toLocaleString()}
                      {p.discount_pct > 0 && (
                        <div className="admin-hint" style={{ color: 'var(--danger)' }}>
                          -{p.discount_pct}%
                        </div>
                      )}
                    </td>
                    <td>{p.bv_points}</td>
                    <td>
                      <span style={{ color: lowStock ? 'var(--danger)' : 'var(--success)' }}>
                        {p.stock === -1 ? '∞' : p.stock}
                        {lowStock && ' ⚠️'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${p.is_active ? 'admin-pill--ok' : ''}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--accent"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          onClick={() => {
                            if (confirm('Deactivate product?')) deleteMutation.mutate(p.id)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="admin-card__body admin-hint" style={{ borderTop: '1px solid var(--line)' }}>
          Total: {data?.total || 0}
        </div>
      </div>
    </div>
  )
}
