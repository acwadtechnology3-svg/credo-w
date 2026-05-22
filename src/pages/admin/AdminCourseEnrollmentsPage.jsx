import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetEnrollments, adminGrantAccess, adminGetCourses } from '../../api/courses.api'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../components/shared/Toast'

export default function AdminCourseEnrollmentsPage() {
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === 'super_admin'
  const qc = useQueryClient()
  const [courseFilter, setCourseFilter] = useState('')
  const [grantForm, setGrantForm] = useState({ user_id: '', course_id: '' })

  const { data: courses } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: () => adminGetCourses({ limit: 100 }),
    enabled: isSuperAdmin,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-course-enrollments', courseFilter],
    queryFn: () => adminGetEnrollments({ course_id: courseFilter || undefined }),
  })

  const grantMutation = useMutation({
    mutationFn: adminGrantAccess,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course-enrollments'] })
      setGrantForm({ user_id: '', course_id: '' })
      toast.success('Access granted')
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Grant failed'),
  })

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
        🎓 Course Enrollments
      </h2>

      {isSuperAdmin && (
        <div
          style={{
            background: '#EEEDFE',
            border: '1px solid #AFA9EC',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '10px', color: '#3C3489' }}>Grant Access</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
            <input
              placeholder="User ID (UUID)"
              value={grantForm.user_id}
              onChange={(e) => setGrantForm((p) => ({ ...p, user_id: e.target.value }))}
              style={{
                padding: '8px 10px',
                border: '1px solid #AFA9EC',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <select
              value={grantForm.course_id}
              onChange={(e) => setGrantForm((p) => ({ ...p, course_id: e.target.value }))}
              style={{
                padding: '8px 10px',
                border: '1px solid #AFA9EC',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              <option value="">— Select course —</option>
              {(courses?.data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => grantMutation.mutate(grantForm)}
              disabled={!grantForm.user_id || !grantForm.course_id || grantMutation.isPending}
              style={{
                background: '#534AB7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Grant
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
            Use for invited-only courses. Find user ID from Users management.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #eee',
            borderRadius: '8px',
            fontSize: '13px',
            minWidth: '240px',
          }}
        >
          <option value="">All courses</option>
          {(courses?.data || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['User', 'Email', 'Course', 'Progress', 'Enrolled', 'Completed'].map((h) => (
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
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data?.data || []).map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px' }}>
                    {row.users?.full_name || row.users?.username || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>{row.users?.email || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{row.courses?.title || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{row.completion_pct || 0}%</td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {row.enrolled_at ? new Date(row.enrolled_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}
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
