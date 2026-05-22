import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { mlmAdminController } from '../controllers/mlmAdmin.controller.js'

export const mlmAdminRouter = Router()
mlmAdminRouter.use(authMiddleware, roleGuard(['super_admin', 'admin']))

mlmAdminRouter.get('/overview', mlmAdminController.getOverview)
mlmAdminRouter.get('/rules', mlmAdminController.listRules)
mlmAdminRouter.put('/rules', mlmAdminController.updateRule)
mlmAdminRouter.get('/fraud', mlmAdminController.listFraudFlags)
mlmAdminRouter.post('/queue/process', mlmAdminController.processQueue)
mlmAdminRouter.post('/events/:eventId/replay', mlmAdminController.replayEvent)
mlmAdminRouter.post('/users/:userId/rebuild-metrics', mlmAdminController.rebuildUser)
mlmAdminRouter.post('/orders/:orderId/reverse', mlmAdminController.reverseOrder)
mlmAdminRouter.post('/payouts/approve', mlmAdminController.approvePayout)
