import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourseContent, updateLessonProgress } from '../../api/courses.api'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { extractYouTubeId } from '../../lib/youtube'

export default function CourseLearnPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeLesson, setActiveLesson] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: () => getCourseContent(courseId),
  })

  const progressMutation = useMutation({
    mutationFn: ({ lessonId, body }) => updateLessonProgress(courseId, lessonId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-content', courseId] }),
  })

  useEffect(() => {
    if (data?.sections?.[0]?.lessons?.[0] && !activeLesson) {
      const sorted = [...(data.sections[0].lessons || [])].sort((a, b) => a.sort_order - b.sort_order)
      setActiveLesson(sorted[0])
    }
  }, [data, activeLesson])

  const isCompleted = (lessonId) => data?.progressMap?.[lessonId]?.is_completed

  const markComplete = (lessonId) => {
    progressMutation.mutate({ lessonId, body: { is_completed: true, watched_seconds: 0 } })
  }

  if (isLoading) return <div style={{ padding: '2rem', color: '#888' }}>Loading course...</div>
  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#c00' }}>{error?.response?.data?.error || 'Cannot load course'}</p>
        <button type="button" onClick={() => navigate('/courses')} style={{ marginTop: '12px' }}>
          ← Academy
        </button>
      </div>
    )
  }

  const videoId = activeLesson?.video_url ? extractYouTubeId(activeLesson.video_url) : null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      <div
        style={{
          width: '300px',
          flexShrink: 0,
          overflowY: 'auto',
          borderRight: '1px solid #eee',
          background: '#fafafa',
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Course Content</div>
          <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
            <div
              style={{
                height: '6px',
                background: '#534AB7',
                borderRadius: '3px',
                width: `${data?.enrollment?.completion_pct || 0}%`,
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
            {data?.enrollment?.completion_pct || 0}% complete
          </div>
        </div>

        {(data?.sections || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((section, si) => (
            <div key={section.id}>
              <div
                style={{
                  padding: '10px 16px 6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {si + 1}. {section.title}
              </div>
              {(section.lessons || [])
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((lesson, li) => (
                  <div
                    key={lesson.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveLesson(lesson)}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveLesson(lesson)}
                    style={{
                      padding: '8px 16px 8px 24px',
                      cursor: 'pointer',
                      background: activeLesson?.id === lesson.id ? '#EEEDFE' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>
                      {isCompleted(lesson.id)
                        ? '✅'
                        : lesson.content_type === 'video'
                          ? '▶️'
                          : lesson.content_type === 'pdf'
                            ? '📄'
                            : '📝'}
                    </span>
                    <span
                      style={{
                        color: activeLesson?.id === lesson.id ? '#3C3489' : '#333',
                        fontWeight: activeLesson?.id === lesson.id ? '500' : '400',
                        lineHeight: 1.4,
                      }}
                    >
                      {li + 1}. {lesson.title}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#888', flexShrink: 0 }}>
                      {lesson.duration_minutes}m
                    </span>
                  </div>
                ))}
            </div>
          ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {activeLesson ? (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>{activeLesson.title}</h2>
            {activeLesson.content_type === 'video' && activeLesson.video_url && (
              <div
                style={{
                  marginBottom: '20px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#000',
                  position: 'relative',
                  paddingTop: '56.25%',
                }}
              >
                {videoId ? (
                  <iframe
                    title={activeLesson.title}
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  >
                    Invalid YouTube URL — use Public or Unlisted link
                  </div>
                )}
              </div>
            )}
            {activeLesson.content_type === 'pdf' && activeLesson.pdf_url && (
              <div style={{ marginBottom: '20px' }}>
                <iframe
                  title="PDF"
                  src={activeLesson.pdf_url}
                  style={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid #eee',
                    borderRadius: '12px',
                  }}
                />
              </div>
            )}
            {activeLesson.content_type === 'text' && activeLesson.text_content && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '14px',
                  lineHeight: '1.8',
                  marginBottom: '20px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {activeLesson.text_content}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => markComplete(activeLesson.id)}
                disabled={isCompleted(activeLesson.id) || progressMutation.isPending}
                style={{
                  background: isCompleted(activeLesson.id) ? '#EAF3DE' : '#534AB7',
                  color: isCompleted(activeLesson.id) ? '#27500A' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  cursor: isCompleted(activeLesson.id) ? 'default' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {isCompleted(activeLesson.id) ? '✅ Completed' : 'Mark as Complete'}
              </button>
              {data?.enrollment?.completion_pct === 100 && data?.enrollment?.certificate_url && (
                <button
                  type="button"
                  onClick={() => window.open(data.enrollment.certificate_url, '_blank')}
                  style={{
                    background: '#BA7517',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  🏆 Download Certificate
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
            <div style={{ fontSize: '16px' }}>Select a lesson to start learning</div>
          </div>
        )}
      </div>
    </div>
  )
}
