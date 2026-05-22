import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { withdrawalController } from '../controllers/withdrawal.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/', withdrawalController.getWithdrawals)
router.post('/request', withdrawalController.requestWithdrawal)
router.get('/accounts', withdrawalController.getBankAccounts)
router.post('/accounts', withdrawalController.addBankAccount)
router.delete('/accounts/:id', withdrawalController.deleteBankAccount)

export { router as withdrawalRouter }
