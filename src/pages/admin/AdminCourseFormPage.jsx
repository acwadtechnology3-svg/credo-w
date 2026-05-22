import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminGetCourse,
  adminCreateCourse,
  adminUpdateCourse,
  getCourseCategories,
} from '../../api/courses.api'
import { uploadProductImage } from '../../api/adminProducts.api'
import { getSARanks } from '../../api/superAdmin.api'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

const emptyForm = {
  title: '',
  short_description: '',
  description: '',
  thumbnail_url: '',
  preview_video_url: '',
  instructor_name: '',
  instructor_bio: '',
  category_id: '',
  price_egp: '0',
  is_free: false,
  access_type: 'public',
  required_rank_id: '',
  level: 'beginner',
  language: 'ar',
  requirements: '',
  what_you_learn: '',
  status: 'draft',
}

export default function AdminCourseFormPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!courseId

  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCourseCategories,
  })
  const { data: ranksData } = useQuery({
    queryKey: ['sa-ranks'],
    queryFn: getSARanks,
  })
  const { data: course } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => adminGetCourse(courseId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!course) return
    setForm({
      title: course.title,
      short_description: course.short_description || '',
      description: course.description || '',
      thumbnail_url: course.thumbnail_url || '',
      preview_video_url: course.preview_video_url || '',
      instructor_name: course.instructor_name || '',
      instructor_bio: course.instructor_bio || '',
      category_id: course.category_id || '',
      price_egp: course.price_egp || '0',
      is_free: !!course.is_free,
      access_type: course.access_type || 'public',
      required_rank_id: course.required_rank_id || '',
      level: course.level || 'beginner',
      language: course.language || 'ar',
      requirements: course.requirements || '',
      what_you_learn: course.what_you_learn || '',
      status: course.status || 'draft',
    })
  }, [course])

  const saveMutation = useMutation({
    mutationFn: (body) => (isEdit ? adminUpdateCourse(courseId, body) : adminCreateCourse(body)),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
      navigate(isEdit ? `/admin/courses/${courseId}/lessons` : `/admin/courses/${data.id}/lessons`)
    },
  })

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const result = await uploadProductImage({
          base64: ev.target.result,
          filename: file.name,
          folder: 'courses',
        })
        setForm((p) => ({ ...p, thumbnail_url: result.url }))
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #eee',
    borderRadius: '8px',
    fontSize: '13px',
  }
  const labelStyle = { display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>{isEdit ? 'Edit Course' : 'New Course'}</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/courses')}
          style={{
            background: '#f5f5f5',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 16px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Course Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            style={inputStyle}
            placeholder="Enter course title..."
          />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Short Description (shown in card)</label>
          <input
            value={form.short_description}
            onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
            style={inputStyle}
            maxLength={500}
          />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
            style={inputStyle}
          >
            <option value="">— Select category —</option>
            {(categories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Instructor Name</label>
          <input
            value={form.instructor_name}
            onChange={(e) => setForm((p) => ({ ...p, instructor_name: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Level</label>
          <select
            value={form.level}
            onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
            style={inputStyle}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            style={inputStyle}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="is_free"
            checked={form.is_free}
            onChange={(e) => setForm((p) => ({ ...p, is_free: e.target.checked }))}
          />
          <label htmlFor="is_free" style={{ fontSize: '13px', cursor: 'pointer' }}>
            Free Course
          </label>
        </div>
        {!form.is_free && (
          <div>
            <label style={labelStyle}>Price (EGP)</label>
            <input
              type="number"
              value={form.price_egp}
              onChange={(e) => setForm((p) => ({ ...p, price_egp: e.target.value }))}
              style={inputStyle}
            />
          </div>
        )}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Who can access this course?</label>
          <select
            value={form.access_type}
            onChange={(e) => setForm((p) => ({ ...p, access_type: e.target.value }))}
            style={inputStyle}
          >
            <option value="public">🌍 Public — Anyone can enroll</option>
            <option value="marketers_only">👥 Marketers Only — Ambassadors and above</option>
            <option value="invited_only">🔒 Invited Only — Super Admin grants access manually</option>
            <option value="rank_required">🏆 Rank Required — Specific rank and above</option>
          </select>
          <div
            style={{
              marginTop: '6px',
              fontSize: '11px',
              color: '#888',
              padding: '8px 10px',
              background: '#f8f8f8',
              borderRadius: '6px',
            }}
          >
            {form.access_type === 'public' && '✅ Everyone can see and enroll in this course'}
            {form.access_type === 'marketers_only' &&
              '👥 Only ambassadors, franchise, and admins can enroll'}
            {form.access_type === 'invited_only' &&
              '🔒 Course is hidden from browse. Add users via Grant Access on enrollments page'}
            {form.access_type === 'rank_required' &&
              '🏆 User must be at the selected rank or higher to enroll'}
          </div>
        </div>
        {form.access_type === 'rank_required' && (
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Minimum Required Rank</label>
            <select
              value={form.required_rank_id}
              onChange={(e) => setForm((p) => ({ ...p, required_rank_id: e.target.value }))}
              style={inputStyle}
            >
              <option value="">-- Select minimum rank --</option>
              {(ranksData || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Thumbnail Image</label>
          {form.thumbnail_url ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={form.thumbnail_url}
                alt=""
                style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, thumbnail_url: '' }))}
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
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '200px',
                height: '120px',
                border: '2px dashed #eee',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#888',
                fontSize: '13px',
              }}
            >
              {uploading ? 'Uploading...' : '📷 Upload thumbnail'}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Preview Video URL (YouTube)</label>
          <input
            value={form.preview_video_url}
            onChange={(e) => setForm((p) => ({ ...p, preview_video_url: e.target.value }))}
            style={inputStyle}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Full Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>What You&apos;ll Learn (one item per line)</label>
          <textarea
            value={form.what_you_learn}
            onChange={(e) => setForm((p) => ({ ...p, what_you_learn: e.target.value }))}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder={'Item 1\nItem 2\nItem 3'}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => saveMutation.mutate(form)}
        disabled={!form.title || saveMutation.isPending}
        style={{
          width: '100%',
          padding: '12px',
          background: !form.title ? '#aaa' : '#534AB7',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        {saveMutation.isPending
          ? 'Saving...'
          : isEdit
            ? 'Update Course → Go to Content'
            : 'Create Course → Add Content'}
      </button>
    </div>
  )
}
