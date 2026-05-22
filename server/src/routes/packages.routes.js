import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePurchaseBody } from '../middleware/validate.middleware.js'
import { financialLimiter } from '../middleware/security.middleware.js'
import { packagesController } from '../controllers/packages.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/my-status', packagesController.getMyPackageStatus)
router.post('/purchase', financialLimiter, requirePurchaseBody, packagesController.purchasePackage)

export { router as packagesRouter }
