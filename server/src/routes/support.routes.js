import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { supportController } from '../controllers/support.controller.js'
import { supportMessageLimiter, supportTicketLimiter } from '../middleware/supportRateLimit.js'

const router = Router()

router.get('/stats', supportController.getStats)

router.use(authMiddleware)

router.post('/ai', supportMessageLimiter, supportController.aiAssist)
router.get('/unread', supportController.getUnread)
router.post('/', supportTicketLimiter, supportController.createTicket)
router.get('/my', supportController.getMyTickets)
router.get('/all', roleGuard('admin', 'super_admin'), supportController.getAllTickets)
router.get('/users/:userId/context', roleGuard('admin', 'super_admin'), supportController.getUserContext)
router.get('/:id', supportController.getTicket)
router.post('/:id/messages', supportMessageLimiter, supportController.sendMessage)
router.post('/:id/upload', supportMessageLimiter, supportController.uploadFile)
router.patch('/:id', roleGuard('admin', 'super_admin'), supportController.updateTicket)
router.put('/:id/reply', roleGuard('admin', 'super_admin'), supportController.replyTicket)

export { router as supportRouter }
