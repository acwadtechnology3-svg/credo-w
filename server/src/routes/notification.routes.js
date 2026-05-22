import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { notificationController } from '../controllers/notification.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/sent', notificationController.getSentMessages)
router.get('/', notificationController.getNotifications)
router.get('/:id', notificationController.getNotification)
router.post('/:id/reply', notificationController.replyToNotification)
router.post('/read', notificationController.markRead)
router.delete('/:id', notificationController.deleteNotification)

export { router as notificationRouter }
