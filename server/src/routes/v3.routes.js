import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { financialLimiter } from '../middleware/security.middleware.js'
import { financeController } from '../controllers/v3/finance.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/finance/wallets', financeController.getWallets)
router.get('/finance/ledger', financeController.getLedger)
router.get('/finance/payment-methods', financeController.getPaymentMethods)
router.post('/finance/hybrid/quote', financeController.quoteHybrid)
router.post('/finance/payment-sessions', financialLimiter, financeController.createPaymentSession)
router.get('/finance/payment-sessions/:id', financeController.getPaymentSession)
router.post('/finance/payment-sessions/:id/reserve', financialLimiter, financeController.reserveWallets)
router.post(
  '/finance/payment-sessions/:id/complete-wallet',
  financialLimiter,
  financeController.completeWalletPayment
)
router.post('/finance/payment-sessions/:id/proof', financialLimiter, financeController.uploadProof)
router.post('/finance/transfer', financialLimiter, financeController.transfer)

export { router as v3Router }
