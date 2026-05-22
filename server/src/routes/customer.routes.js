import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { customerController } from '../controllers/customer.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/pearls', customerController.getPearlsWallet)
router.get('/vouchers', customerController.getVouchers)
router.get('/community', customerController.getCommunity)
router.get('/membership', customerController.getMembership)
router.get('/subscriptions', customerController.getAvailableSubscriptions)
router.post('/subscriptions/subscribe', customerController.subscribe)

export { router as customerRouter }
