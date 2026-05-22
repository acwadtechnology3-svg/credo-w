import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { invitationsController } from '../controllers/invitations.controller.js'

const router = Router()

router.get('/hub', authMiddleware, invitationsController.getHub)
router.get('/', authMiddleware, invitationsController.list)
router.post('/', authMiddleware, invitationsController.create)
router.get('/:id/card', authMiddleware, invitationsController.getCard)
router.post('/:id/send-email', authMiddleware, invitationsController.resendEmail)
router.post('/:id/reject', authMiddleware, invitationsController.reject)

export { router as invitationsRouter }
