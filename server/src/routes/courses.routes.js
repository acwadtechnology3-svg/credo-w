import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { optionalAuthMiddleware } from '../middleware/optionalAuth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { coursesController } from '../controllers/courses.controller.js'

const router = Router()

router.get('/categories', coursesController.getCategories)
router.get('/public', coursesController.getAllCourses)
router.get('/public/:id', optionalAuthMiddleware, coursesController.getCourse)

router.use(authMiddleware)

router.post('/enroll', coursesController.enrollCourse)
router.get('/my-enrollments', coursesController.getMyEnrollments)
router.post('/review', coursesController.submitReview)

router.get('/admin/all', roleGuard('admin', 'super_admin'), coursesController.adminGetCourses)
router.get('/admin/enrollments', roleGuard('admin', 'super_admin'), coursesController.adminGetEnrollments)
router.get('/admin/:id', roleGuard('super_admin'), coursesController.adminGetCourse)
router.post('/admin', roleGuard('super_admin'), coursesController.adminCreateCourse)
router.put('/admin/:id', roleGuard('super_admin'), coursesController.adminUpdateCourse)
router.delete('/admin/:id', roleGuard('super_admin'), coursesController.adminDeleteCourse)
router.post('/admin/sections', roleGuard('super_admin'), coursesController.adminCreateSection)
router.put('/admin/sections/:id', roleGuard('super_admin'), coursesController.adminUpdateSection)
router.delete('/admin/sections/:id', roleGuard('super_admin'), coursesController.adminDeleteSection)
router.post('/admin/lessons', roleGuard('super_admin'), coursesController.adminCreateLesson)
router.put('/admin/lessons/:id', roleGuard('super_admin'), coursesController.adminUpdateLesson)
router.delete('/admin/lessons/:id', roleGuard('super_admin'), coursesController.adminDeleteLesson)
router.post('/admin/grant-access', roleGuard('super_admin'), coursesController.adminGrantAccess)

router.get('/:course_id/content', coursesController.getCourseContent)
router.post('/:course_id/lessons/:lesson_id/progress', coursesController.updateLessonProgress)

export { router as coursesRouter }
