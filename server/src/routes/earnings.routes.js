import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { earningsController } from '../controllers/earnings.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/wallet', earningsController.getWallet)
router.get('/team-commission', earningsController.getTeamCommission)
router.get('/level-bonus', earningsController.getLevelBonus)
router.get('/fast-start', earningsController.getFastStart)
router.get('/rank-bonus', earningsController.getRankBonus)
router.get('/retail-profit', earningsController.getRetailProfit)
router.post('/commission/run', roleGuard('admin', 'super_admin'), earningsController.runCommission)

export { router as earningsRouter }
