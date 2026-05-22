import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { walletController } from '../controllers/wallet.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/summary', walletController.getSummary)
router.get('/receive', walletController.receiveInfo)
router.get('/lookup', walletController.lookupUser)
router.get('/', walletController.getWallets)
router.post('/exchange', walletController.exchangeWallets)
router.get('/pin-status', walletController.getPinStatus)
router.post('/verify-password', walletController.verifyAccountPassword)
router.post('/cmoney/transfer', walletController.transferCMoney)
router.post('/cmoney/set-pin', walletController.setPin)

export { router as walletRouter }
