import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetCourses, adminDeleteCourse } from '../../api/courses.api'
import { useNavigate } from 'react-router-dom'

const statusColor = { draft: '#BA7517', published: '#27500A', archived: '#888' }
const statusBg = { draft: '#FAEEDA', published: '#EAF3DE', archived: '#f5f5f5' }

export default function AdminCoursesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminGetCourses({ limit: 50 }),
  })

  const deleteMutation = useMutation({
    mutationFn: adminDeleteCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }),
  })

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
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>Credo Academy — Courses</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/courses/new')}
          style={{
            background: '#534AB7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          + New Course
        </button>
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Title', 'Category', 'Price', 'Enrolled', 'Rating', 'Lessons', 'Access', 'Status', 'Actions'].map(
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
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data?.data || []).map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '500', maxWidth: '220px' }}>{c.title}</td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>{c.course_categories?.name || '—'}</td>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontWeight: '600',
                      color: c.is_free ? '#27500A' : '#534AB7',
                    }}
                  >
                    {c.is_free ? 'FREE' : `EGP ${parseFloat(c.price_egp).toLocaleString()}`}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888', textAlign: 'center' }}>
                    {c.enrolled_count || 0}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#BA7517' }}>
                    ⭐ {parseFloat(c.rating_avg || 0).toFixed(1)}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#888', textAlign: 'center' }}>
                    {c.lessons_count || 0}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '11px', color: '#666' }}>
                    {c.access_type || 'public'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        background: statusBg[c.status] || '#f5f5f5',
                        color: statusColor[c.status] || '#888',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/courses/${c.id}/edit`)}
                        style={{
                          background: '#EEEDFE',
                          color: '#3C3489',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/courses/${c.id}/lessons`)}
                        style={{
                          background: '#EAF3DE',
                          color: '#27500A',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Content
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Archive course?')) deleteMutation.mutate(c.id)
                        }}
                        style={{
                          background: '#FCEBEB',
                          color: '#c00',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Archive
                      </button>
                    </div>
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
