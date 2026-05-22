import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { franchiseController } from '../controllers/franchise.controller.js'

const router = Router()
router.use(authMiddleware)
router.use(roleGuard('franchise', 'admin'))

router.get('/overview', franchiseController.getOverview)
router.get('/network', franchiseController.getNetworkAmbassadors)
router.put('/network/:userId/activate', franchiseController.activateAmbassador)

export { router as franchiseRouter }
