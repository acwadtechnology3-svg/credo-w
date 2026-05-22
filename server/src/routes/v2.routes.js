import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePurchaseBodyV2, requireUuidParam } from '../middleware/validate.middleware.js'
import { financialLimiter } from '../middleware/security.middleware.js'
import { checkoutController } from '../controllers/v2/checkout.controller.js'
import { purchasesController } from '../controllers/v2/purchases.controller.js'
import { membershipController } from '../controllers/v2/membership.controller.js'

const router = Router()
router.use(authMiddleware)

router.post('/checkout/session', financialLimiter, checkoutController.createSession)
router.post('/purchases', financialLimiter, requirePurchaseBodyV2, purchasesController.create)
router.get('/purchases/:id', requireUuidParam('id'), purchasesController.getById)
router.get('/membership/me', membershipController.getMe)

export { router as v2Router }
