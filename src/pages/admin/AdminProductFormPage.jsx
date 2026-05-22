import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  uploadProductImage,
  getAdminCategories,
} from '../../api/adminProducts.api'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

const emptyForm = {
  name: '',
  description: '',
  category_id: '',
  price_egp: '',
  original_price_egp: '',
  discount_pct: '0',
  tax_rate: '14',
  bv_points: '0',
  pv_points: '0',
  direct_commission_egp: '0',
  is_package: false,
  stock: '-1',
  low_stock_alert: '10',
  meta_description: '',
}

export default function AdminProductFormPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!productId

  const [form, setForm] = useState(emptyForm)
  const [images, setImages] = useState([])
  const [variants, setVariants] = useState([])
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  })
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => getAdminProduct(productId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      price_egp: String(product.price_egp ?? ''),
      original_price_egp: product.original_price_egp != null ? String(product.original_price_egp) : '',
      discount_pct: String(product.discount_pct ?? '0'),
      tax_rate: String(product.tax_rate ?? '14'),
      bv_points: String(product.bv_points ?? '0'),
      pv_points: String(product.pv_points ?? '0'),
      direct_commission_egp: String(product.direct_commission_egp ?? '0'),
      is_package: !!product.is_package,
      stock: String(product.stock ?? '-1'),
      low_stock_alert: String(product.low_stock_alert ?? '10'),
      meta_description: product.meta_description || '',
    })
    setImages(product.product_images?.map((i) => i.image_url) || [])
    setVariants(product.product_variants || [])
  }, [product])

  const saveMutation = useMutation({
    mutationFn: (body) => (isEdit ? updateAdminProduct(productId, body) : createAdminProduct(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      navigate('/admin/products')
    },
    onError: (err) => setMsg(err?.response?.data?.error || 'Save failed'),
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const result = await uploadProductImage({
          base64: ev.target.result,
          filename: file.name,
          folder: 'products',
        })
        setImages((p) => [...p, result.url])
      } catch {
        setMsg('Image upload failed')
      }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  if (isEdit && productLoading) {
    return (
      <div className="admin-form-page">
        <p className="admin-hint">Loading product...</p>
      </div>
    )
  }

  return (
    <div className="admin-form-page admin-panel page-enter">
      <div className="admin-form-page__header">
        <h2 className="admin-panel__title">{isEdit ? 'Edit Product' : 'New Product'}</h2>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => navigate('/admin/products')}
        >
          ← Back
        </button>
      </div>

      {msg && <div className="admin-alert--error">{msg}</div>}

      <div className="admin-form-grid">
        <div className="admin-form-grid__full">
          <label className="admin-field-label">Product Name *</label>
          <input
            className="admin-input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Enter product name..."
          />
        </div>
        <div>
          <label className="admin-field-label">Category</label>
          <select
            className="admin-select"
            value={form.category_id}
            onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
          >
            <option value="">-- Select Category --</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-field-label">Price (EGP) *</label>
          <input
            type="number"
            className="admin-input"
            value={form.price_egp}
            onChange={(e) => setForm((p) => ({ ...p, price_egp: e.target.value }))}
          />
        </div>
        <div>
          <label className="admin-field-label">Original Price (before discount)</label>
          <input
            type="number"
            className="admin-input"
            value={form.original_price_egp}
            onChange={(e) => setForm((p) => ({ ...p, original_price_egp: e.target.value }))}
          />
        </div>
        <div>
          <label className="admin-field-label">Discount %</label>
          <input
            type="number"
            className="admin-input"
            value={form.discount_pct}
            onChange={(e) => setForm((p) => ({ ...p, discount_pct: e.target.value }))}
          />
        </div>
        <div>
          <label className="admin-field-label">BV Points</label>
          <input
            type="number"
            className="admin-input"
            value={form.bv_points}
            onChange={(e) => setForm((p) => ({ ...p, bv_points: e.target.value }))}
          />
        </div>
        <div>
          <label className="admin-field-label">PV Points</label>
          <input
            type="number"
            className="admin-input"
            value={form.pv_points}
            onChange={(e) => setForm((p) => ({ ...p, pv_points: e.target.value }))}
          />
        </div>
        <div>
          <label className="admin-field-label">Direct Commission (EGP — packages)</label>
          <input
            type="number"
            className="admin-input"
            value={form.direct_commission_egp}
            onChange={(e) => setForm((p) => ({ ...p, direct_commission_egp: e.target.value }))}
          />
        </div>
        <div>
          <label className="admin-field-label">Stock (-1 = unlimited)</label>
          <input
            type="number"
            className="admin-input"
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
          />
        </div>
        <div>
          <label className="admin-field-label">Low Stock Alert</label>
          <input
            type="number"
            className="admin-input"
            value={form.low_stock_alert}
            onChange={(e) => setForm((p) => ({ ...p, low_stock_alert: e.target.value }))}
          />
        </div>
        <div className="admin-form-grid__full">
          <label className="admin-field-label">Description</label>
          <textarea
            className="admin-textarea"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            placeholder="Detailed product description..."
          />
        </div>
        <div className="admin-form-grid__full">
          <label className="admin-form-check">
            <input
              type="checkbox"
              checked={form.is_package}
              onChange={(e) => setForm((p) => ({ ...p, is_package: e.target.checked }))}
            />
            <span>This is a Package (triggers direct commission on purchase)</span>
          </label>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card__head">Product Images</div>
        <div className="admin-card__body">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {images.map((url, i) => (
              <div key={url} style={{ position: 'relative' }}>
                <img
                  src={url}
                  alt=""
                  className={`admin-img-thumb${i === 0 ? ' admin-img-thumb--primary' : ''}`}
                />
                {i === 0 && (
                  <span className="admin-pill admin-pill--purple" style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, padding: '1px 5px' }}>
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    padding: 0,
                    borderRadius: '50%',
                    fontSize: 11,
                    lineHeight: 1,
                  }}
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="admin-upload-tile">
              {uploading ? '…' : '+'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
          <p className="admin-hint">First image is primary. Click × to remove.</p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Product Variants (optional)</span>
          <button
            type="button"
            className="admin-btn admin-btn--accent"
            onClick={() =>
              setVariants((p) => [...p, { name: '', value: '', price_adjustment: '0', stock: '-1' }])
            }
          >
            + Add Variant
          </button>
        </div>
        <div className="admin-card__body">
          {variants.map((v, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 8,
                alignItems: 'center',
              }}
            >
              <input
                className="admin-input"
                placeholder="Type (e.g. Color)"
                value={v.name}
                onChange={(e) =>
                  setVariants((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
              />
              <input
                className="admin-input"
                placeholder="Value (e.g. Red)"
                value={v.value}
                onChange={(e) =>
                  setVariants((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
              />
              <input
                type="number"
                className="admin-input"
                placeholder="Price ±"
                value={v.price_adjustment}
                onChange={(e) =>
                  setVariants((p) =>
                    p.map((x, j) => (j === i ? { ...x, price_adjustment: e.target.value } : x))
                  )
                }
              />
              <input
                type="number"
                className="admin-input"
                placeholder="Stock (-1=∞)"
                value={v.stock}
                onChange={(e) =>
                  setVariants((p) => p.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))
                }
              />
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => setVariants((p) => p.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
          {variants.length === 0 && (
            <p className="admin-hint" style={{ textAlign: 'center', padding: '1rem 0' }}>
              No variants. Add colors, sizes, etc.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="admin-btn admin-btn--primary admin-btn--block"
        onClick={() => saveMutation.mutate({ ...form, images, variants })}
        disabled={!form.name || !form.price_egp || saveMutation.isPending}
      >
        {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
      </button>
    </div>
  )
}
