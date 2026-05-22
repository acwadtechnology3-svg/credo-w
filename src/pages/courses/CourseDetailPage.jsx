import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPublicCourse, enrollCourse } from '../../api/courses.api'
import { useNavigate, useParams } from 'react-router-dom'
import { extractYouTubeId, youtubeEmbedUrl } from '../../lib/youtube'
import { toast } from '../../components/shared/Toast'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => getPublicCourse(courseId),
  })

  const enrollMutation = useMutation({
    mutationFn: () => enrollCourse(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-detail', courseId] })
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
      toast.success('Enrolled!')
      navigate(`/courses/${courseId}/learn`)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Enrollment failed'),
  })

  if (isLoading) return <div style={{ padding: '2rem', color: '#888' }}>Loading...</div>
  if (error || !course) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>Course not found</p>
        <button type="button" onClick={() => navigate('/courses')} style={{ marginTop: '12px' }}>
          ← Back to Academy
        </button>
      </div>
    )
  }

  const isEnrolled = !!course.enrollment
  const previewId = extractYouTubeId(course.preview_video_url)
  const learnItems = (course.what_you_learn || '').split('\n').filter(Boolean)

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px' }}>
      <button
        type="button"
        onClick={() => navigate('/courses')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#534AB7',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '13px',
        }}
      >
        ← Back to Academy
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
        <div>
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              style={{
                width: '100%',
                maxHeight: '220px',
                objectFit: 'cover',
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            />
          )}
          <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>{course.title}</h1>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
            {course.instructor_name} · {course.lessons_count} lessons · ⭐{' '}
            {parseFloat(course.rating_avg || 0).toFixed(1)} · {course.level}
          </p>

          {previewId && youtubeEmbedUrl(course.preview_video_url) && (
            <div
              style={{
                marginBottom: '20px',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                paddingTop: '56.25%',
                background: '#000',
              }}
            >
              <iframe
                title="Preview"
                src={youtubeEmbedUrl(course.preview_video_url)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allowFullScreen
              />
            </div>
          )}

          {course.description && (
            <div style={{ marginBottom: '20px', fontSize: '14px', lineHeight: 1.7, color: '#333' }}>
              {course.description}
            </div>
          )}

          {learnItems.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What you&apos;ll learn</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.8 }}>
                {learnItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {course.course_sections?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Curriculum</h3>
              {course.course_sections
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((section) => (
                  <div key={section.id} style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '6px' }}>
                      {section.title}
                    </div>
                    {(section.lessons || [])
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((lesson, i) => (
                        <div
                          key={lesson.id}
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            padding: '4px 0',
                            paddingLeft: '12px',
                          }}
                        >
                          {i + 1}. {lesson.title}
                          {lesson.is_free_preview && (
                            <span style={{ color: '#27500A', marginLeft: '6px' }}>· Preview</span>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '20px',
            height: 'fit-content',
            position: 'sticky',
            top: '24px',
          }}
        >
          <div
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: course.is_free ? '#27500A' : '#534AB7',
              marginBottom: '16px',
            }}
          >
            {course.is_free ? 'FREE' : `EGP ${parseFloat(course.price_egp).toLocaleString()}`}
          </div>
          {course.access_type === 'rank_required' && course.ranks?.name && (
            <p style={{ fontSize: '12px', color: '#BA7517', marginBottom: '12px' }}>
              🏆 Requires rank: {course.ranks.name} or higher
            </p>
          )}
          {isEnrolled ? (
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}/learn`)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#534AB7',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ▶ Continue Learning
            </button>
          ) : (
            <button
              type="button"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              style={{
                width: '100%',
                padding: '12px',
                background: '#534AB7',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
