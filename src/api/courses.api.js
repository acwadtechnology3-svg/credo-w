import client from './client'

export const getCourseCategories = () => client.get('/courses/categories').then((r) => r.data)
export const getPublicCourses = (params) =>
  client.get('/courses/public', { params: { ...params, exclude_invited: true } }).then((r) => r.data)
export const getPublicCourse = (id) => client.get(`/courses/public/${id}`).then((r) => r.data)
export const enrollCourse = (course_id) => client.post('/courses/enroll', { course_id }).then((r) => r.data)
export const getMyEnrollments = () => client.get('/courses/my-enrollments').then((r) => r.data)
export const getCourseContent = (course_id) =>
  client.get(`/courses/${course_id}/content`).then((r) => r.data)
export const updateLessonProgress = (course_id, lesson_id, body) =>
  client.post(`/courses/${course_id}/lessons/${lesson_id}/progress`, body).then((r) => r.data)
export const submitCourseReview = (body) => client.post('/courses/review', body).then((r) => r.data)

export const adminGetCourses = (params) => client.get('/courses/admin/all', { params }).then((r) => r.data)
export const adminGetCourse = (id) => client.get(`/courses/admin/${id}`).then((r) => r.data)
export const adminCreateCourse = (body) => client.post('/courses/admin', body).then((r) => r.data)
export const adminUpdateCourse = (id, body) =>
  client.put(`/courses/admin/${id}`, body).then((r) => r.data)
export const adminDeleteCourse = (id) => client.delete(`/courses/admin/${id}`).then((r) => r.data)
export const adminCreateSection = (body) => client.post('/courses/admin/sections', body).then((r) => r.data)
export const adminUpdateSection = (id, body) =>
  client.put(`/courses/admin/sections/${id}`, body).then((r) => r.data)
export const adminDeleteSection = (id) => client.delete(`/courses/admin/sections/${id}`).then((r) => r.data)
export const adminCreateLesson = (body) => client.post('/courses/admin/lessons', body).then((r) => r.data)
export const adminUpdateLesson = (id, body) =>
  client.put(`/courses/admin/lessons/${id}`, body).then((r) => r.data)
export const adminDeleteLesson = (id) => client.delete(`/courses/admin/lessons/${id}`).then((r) => r.data)
export const adminGrantAccess = (body) =>
  client.post('/courses/admin/grant-access', body).then((r) => r.data)
export const adminGetEnrollments = (params) =>
  client.get('/courses/admin/enrollments', { params }).then((r) => r.data)
