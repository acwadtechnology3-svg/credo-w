import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { adminFinanceController } from '../controllers/adminFinance.controller.js'

const router = Router()
router.use(authMiddleware)
router.use(roleGuard('admin', 'super_admin'))

router.get('/dashboard', adminFinanceController.dashboard)
router.get('/payment-reviews', adminFinanceController.listPaymentReviews)
router.post('/payment-reviews/:id/approve', adminFinanceController.approvePayment)
router.post('/payment-reviews/:id/reject', adminFinanceController.rejectPayment)
router.get('/payment-sessions', adminFinanceController.listPaymentSessions)
router.get('/ledger', adminFinanceController.listLedger)
router.post('/refunds', adminFinanceController.createRefund)
router.post('/refunds/:id/process', adminFinanceController.processRefund)
router.post('/wallet-grant', adminFinanceController.grantWallet)
router.get('/fraud-signals', adminFinanceController.listFraudSignals)
router.post('/payment-reviews/:id/request-proof', adminFinanceController.requestMoreProof)

export { router as adminFinanceRouter }
