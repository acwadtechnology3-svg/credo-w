import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminGetCourse,
  adminCreateSection,
  adminDeleteSection,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
} from '../../api/courses.api'
import { uploadProductImage } from '../../api/adminProducts.api'
import { extractYouTubeId } from '../../lib/youtube'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function AdminCourseLessonsPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [lessonForm, setLessonForm] = useState(null)
  const [uploading, setUploading] = useState(false)

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin-course-content', courseId],
    queryFn: () => adminGetCourse(courseId),
  })

  const sectionMutation = useMutation({
    mutationFn: (body) => adminCreateSection(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course-content', courseId] })
      setNewSectionTitle('')
    },
  })

  const deleteSectionMutation = useMutation({
    mutationFn: adminDeleteSection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-course-content', courseId] }),
  })

  const lessonMutation = useMutation({
    mutationFn: (body) =>
      lessonForm?.id ? adminUpdateLesson(lessonForm.id, body) : adminCreateLesson(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course-content', courseId] })
      setLessonForm(null)
    },
  })

  const deleteLessonMutation = useMutation({
    mutationFn: adminDeleteLesson,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-course-content', courseId] }),
  })

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const result = await uploadProductImage({
          base64: ev.target.result,
          filename: file.name,
          folder: 'pdfs',
        })
        setLessonForm((p) => ({ ...p, pdf_url: result.url }))
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  if (isLoading) return <div style={{ padding: '2rem', color: '#888' }}>Loading...</div>

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid #eee',
    borderRadius: '8px',
    fontSize: '13px',
  }
  const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '3px' }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>{course?.title}</h2>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {course?.lessons_count || 0} lessons · {course?.course_sections?.length || 0} sections
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/courses')}
          style={{
            background: '#f5f5f5',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 16px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          ← Back
        </button>
      </div>

      {lessonForm && (
        <div
          style={{
            background: '#fff',
            border: '2px solid #534AB7',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '14px', color: '#534AB7' }}>
            {lessonForm.id ? 'Edit Lesson' : 'New Lesson'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Title *</label>
              <input
                value={lessonForm.title || ''}
                onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Content Type</label>
              <select
                value={lessonForm.content_type || 'video'}
                onChange={(e) => setLessonForm((p) => ({ ...p, content_type: e.target.value }))}
                style={inputStyle}
              >
                <option value="video">Video (YouTube)</option>
                <option value="pdf">PDF</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration (minutes)</label>
              <input
                type="number"
                value={lessonForm.duration_minutes || ''}
                onChange={(e) => setLessonForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {lessonForm.content_type === 'video' && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>YouTube Video Link *</label>
                <input
                  value={lessonForm.video_url || ''}
                  onChange={(e) => setLessonForm((p) => ({ ...p, video_url: e.target.value }))}
                  style={inputStyle}
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                />
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    background: '#f8f8f8',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#888',
                    lineHeight: '1.8',
                  }}
                >
                  ✅ <strong style={{ color: '#333' }}>Public video:</strong> paste the link directly
                  <br />
                  🔒 <strong style={{ color: '#333' }}>Unlisted video:</strong> paste the link directly — works
                  fine
                  <br />
                  ⚠️ <strong style={{ color: '#c00' }}>Private video:</strong> will NOT work — must be Public or
                  Unlisted
                  <br />
                  <span style={{ fontSize: '11px', color: '#aaa' }}>
                    Supported formats:
                    <br />
                    youtube.com/watch?v=VIDEO_ID
                    <br />
                    youtu.be/VIDEO_ID
                    <br />
                    youtube.com/embed/VIDEO_ID
                  </span>
                </div>
                {lessonForm.video_url && extractYouTubeId(lessonForm.video_url) && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Preview:</div>
                    <iframe
                      title="YouTube preview"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(lessonForm.video_url)}`}
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        aspectRatio: '16/9',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                      }}
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
            {lessonForm.content_type === 'pdf' && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>PDF URL or Upload</label>
                <input
                  value={lessonForm.pdf_url || ''}
                  onChange={(e) => setLessonForm((p) => ({ ...p, pdf_url: e.target.value }))}
                  style={{ ...inputStyle, marginBottom: '6px' }}
                  placeholder="Direct PDF URL..."
                />
                <label style={{ fontSize: '11px', color: '#534AB7', cursor: 'pointer' }}>
                  {uploading ? 'Uploading...' : '📎 Or upload PDF file'}
                  <input type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}
            {lessonForm.content_type === 'text' && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Text Content</label>
                <textarea
                  value={lessonForm.text_content || ''}
                  onChange={(e) => setLessonForm((p) => ({ ...p, text_content: e.target.value }))}
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="free_preview"
                checked={lessonForm.is_free_preview || false}
                onChange={(e) => setLessonForm((p) => ({ ...p, is_free_preview: e.target.checked }))}
              />
              <label htmlFor="free_preview" style={{ fontSize: '13px', cursor: 'pointer' }}>
                Free Preview (visible without enrollment)
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setLessonForm(null)}
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
              onClick={() => lessonMutation.mutate(lessonForm)}
              disabled={!lessonForm.title || lessonMutation.isPending}
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
              {lessonMutation.isPending ? 'Saving...' : 'Save Lesson'}
            </button>
          </div>
        </div>
      )}

      {(course?.course_sections || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((section, si) => (
          <div
            key={section.id}
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '12px',
              marginBottom: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: '#f8f8f8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #eee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#534AB7',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  {si + 1}
                </span>
                <span style={{ fontWeight: '500', fontSize: '13px' }}>{section.title}</span>
                <span style={{ fontSize: '11px', color: '#888' }}>
                  ({section.lessons?.length || 0} lessons)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() =>
                    setLessonForm({
                      course_id: courseId,
                      section_id: section.id,
                      title: '',
                      content_type: 'video',
                      duration_minutes: '',
                      video_url: '',
                      pdf_url: '',
                      text_content: '',
                      is_free_preview: false,
                      sort_order: section.lessons?.length || 0,
                    })
                  }
                  style={{
                    background: '#EAF3DE',
                    color: '#27500A',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Lesson
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete section?')) deleteSectionMutation.mutate(section.id)
                  }}
                  style={{
                    background: '#FCEBEB',
                    color: '#c00',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <div>
              {(section.lessons || [])
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((lesson, li) => (
                  <div
                    key={lesson.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: '1px solid #f8f8f8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {lesson.content_type === 'video'
                          ? '🎬'
                          : lesson.content_type === 'pdf'
                            ? '📄'
                            : '📝'}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>
                          {li + 1}. {lesson.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {lesson.duration_minutes} min
                          {lesson.is_free_preview && ' · Free preview'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setLessonForm({ ...lesson, course_id: courseId })}
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
                        onClick={() => {
                          if (confirm('Delete lesson?')) deleteLessonMutation.mutate(lesson.id)
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
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              {(!section.lessons || section.lessons.length === 0) && (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '12px', color: '#888' }}>
                  No lessons yet. Add one above.
                </div>
              )}
            </div>
          </div>
        ))}

      <div
        style={{
          background: '#EEEDFE',
          border: '1px dashed #AFA9EC',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <input
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title (e.g. Introduction, Module 1...)"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #AFA9EC',
            borderRadius: '8px',
            fontSize: '13px',
            background: 'transparent',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newSectionTitle.trim()) {
              sectionMutation.mutate({
                course_id: courseId,
                title: newSectionTitle,
                sort_order: course?.course_sections?.length || 0,
              })
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (newSectionTitle.trim()) {
              sectionMutation.mutate({
                course_id: courseId,
                title: newSectionTitle,
                sort_order: course?.course_sections?.length || 0,
              })
            }
          }}
          disabled={!newSectionTitle.trim() || sectionMutation.isPending}
          style={{
            background: '#534AB7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Add Section
        </button>
      </div>
    </div>
  )
}
