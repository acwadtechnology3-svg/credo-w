import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPublicCourses, getMyEnrollments, enrollCourse } from '../../api/courses.api'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from '../../components/shared/Toast'

export default function CoursesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data } = useQuery({
    queryKey: ['courses', search],
    queryFn: () => getPublicCourses({ search, limit: 20 }),
  })
  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: getMyEnrollments,
  })

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
      toast.success('Enrolled successfully!')
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Enrollment failed'),
  })

  const enrolledIds = new Set((enrollments || []).map((e) => e.course_id))
  const levelColor = { beginner: '#27500A', intermediate: '#BA7517', advanced: '#c00' }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>🎓 Credo Academy</h2>
          <p style={{ fontSize: '13px', color: '#888' }}>{enrollments?.length || 0} enrolled courses</p>
        </div>
        <input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #eee',
            borderRadius: '8px',
            fontSize: '13px',
            width: '220px',
          }}
        />
      </div>

      {enrollments && enrollments.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '12px', color: '#534AB7' }}>
            📚 My Learning
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '12px',
            }}
          >
            {enrollments.map((e) => (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                style={{
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/courses/${e.course_id}/learn`)}
                onKeyDown={(ev) => ev.key === 'Enter' && navigate(`/courses/${e.course_id}/learn`)}
              >
                {e.courses?.thumbnail_url ? (
                  <img
                    src={e.courses.thumbnail_url}
                    alt=""
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '120px',
                      background: '#EEEDFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                    }}
                  >
                    🎓
                  </div>
                )}
                <div style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '6px' }}>
                    {e.courses?.title}
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: '#f0f0f0',
                      borderRadius: '3px',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        height: '6px',
                        background: '#534AB7',
                        borderRadius: '3px',
                        width: `${e.completion_pct || 0}%`,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {e.completion_pct || 0}% complete {e.completion_pct === 100 && '🏆'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '12px' }}>All Courses</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        {(data?.data || []).map((course) => {
          const isEnrolled = enrolledIds.has(course.id)
          const rankBadge =
            course.access_type === 'rank_required' && course.ranks?.name
              ? `Requires ${course.ranks.name}`
              : null
          return (
            <div
              key={course.id}
              style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}
            >
              <div
                role="button"
                tabIndex={0}
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => navigate(`/courses/${course.id}`)}
                onKeyDown={(ev) => ev.key === 'Enter' && navigate(`/courses/${course.id}`)}
              >
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '140px',
                      background: '#EEEDFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                    }}
                  >
                    🎓
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: levelColor[course.level] || '#888',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500',
                  }}
                >
                  {course.level}
                </span>
                {rankBadge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#BA7517',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500',
                    }}
                  >
                    {rankBadge}
                  </span>
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <div
                  role="button"
                  tabIndex={0}
                  style={{ fontWeight: '500', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  onKeyDown={(ev) => ev.key === 'Enter' && navigate(`/courses/${course.id}`)}
                >
                  {course.title}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                  {course.instructor_name} · {course.lessons_count} lessons · ⭐{' '}
                  {parseFloat(course.rating_avg || 0).toFixed(1)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '15px',
                      color: course.is_free ? '#27500A' : '#534AB7',
                    }}
                  >
                    {course.is_free ? 'FREE' : `EGP ${parseFloat(course.price_egp).toLocaleString()}`}
                  </div>
                  {isEnrolled ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/courses/${course.id}/learn`)}
                      style={{
                        background: '#EAF3DE',
                        color: '#27500A',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      ▶ Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => enrollMutation.mutate(course.id)}
                      disabled={enrollMutation.isPending}
                      style={{
                        background: '#534AB7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
