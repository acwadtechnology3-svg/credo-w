import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  uploadProductImage,
} from '../../api/adminProducts.api'
import { useState } from 'react'

export default function AdminBannersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    sort_order: '0',
    starts_at: '',
    ends_at: '',
  })
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['admin-banners'], queryFn: getAdminBanners })

  const createMutation = useMutation({
    mutationFn: createAdminBanner,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      setShowForm(false)
      setForm({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        sort_order: '0',
        starts_at: '',
        ends_at: '',
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateAdminBanner(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminBanner,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
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
          folder: 'banners',
        })
        setForm((p) => ({ ...p, image_url: result.url }))
      } catch {
        alert('Upload failed')
      }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid #eee',
    borderRadius: '8px',
    fontSize: '13px',
  }
  const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '3px' }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Hero Banners</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#534AB7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          + Add Banner
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '14px' }}>New Banner</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Link URL (optional)</label>
              <input
                value={form.link_url}
                onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Starts At</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ends At</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Banner Image *</label>
            {form.image_url ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={form.image_url}
                  alt=""
                  style={{
                    width: '300px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, image_url: '' }))}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#c00',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '300px',
                  height: '120px',
                  border: '2px dashed #eee',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#888',
                  fontSize: '13px',
                  gap: '6px',
                }}
              >
                {uploading ? 'Uploading...' : '📷 Click to upload banner'}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 18px',
                background: '#f5f5f5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.image_url || createMutation.isPending}
              style={{
                padding: '8px 18px',
                background: '#534AB7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {createMutation.isPending ? 'Saving...' : 'Create Banner'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ color: '#888' }}>Loading...</div>
        ) : (
          (data || []).map((banner) => (
            <div
              key={banner.id}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
              }}
            >
              <img
                src={banner.image_url}
                alt={banner.title || ''}
                style={{
                  width: '160px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '3px' }}>
                  {banner.title || 'Untitled'}
                </div>
                {banner.subtitle && (
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                    {banner.subtitle}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {banner.starts_at && `Starts: ${new Date(banner.starts_at).toLocaleDateString()}`}
                  {banner.ends_at && ` — Ends: ${new Date(banner.ends_at).toLocaleDateString()}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span
                  style={{
                    background: banner.is_active ? '#EAF3DE' : '#f5f5f5',
                    color: banner.is_active ? '#27500A' : '#888',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                  }}
                >
                  {banner.is_active ? 'Active' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    toggleMutation.mutate({ id: banner.id, is_active: !banner.is_active })
                  }
                  style={{
                    background: '#EEEDFE',
                    color: '#3C3489',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {banner.is_active ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete banner?')) deleteMutation.mutate(banner.id)
                  }}
                  style={{
                    background: '#FCEBEB',
                    color: '#c00',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
