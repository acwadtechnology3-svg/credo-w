import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { pearlsController } from '../controllers/pearls.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/wallet', pearlsController.getWallet)
router.get('/transactions', pearlsController.getTransactions)
router.get('/rewards', pearlsController.getRewards)
router.post('/redeem', pearlsController.redeemReward)
router.get('/missions', pearlsController.getMissions)
router.post('/missions/:mission_id/claim', pearlsController.claimMission)
router.get('/achievements', pearlsController.getAchievements)
router.get('/leaderboard', pearlsController.getLeaderboard)

router.post('/admin/grant', roleGuard('admin', 'super_admin'), pearlsController.adminGrant)
router.get('/admin/analytics', roleGuard('admin', 'super_admin'), pearlsController.adminGetAnalytics)

export { router as pearlsRouter }
