import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { progressionAdminController } from '../controllers/progressionAdmin.controller.js'

const router = Router()
router.use(authMiddleware, roleGuard('super_admin'))

router.get('/overview', progressionAdminController.overview)
router.post('/ranks', progressionAdminController.upsertRank)
router.put('/ranks/:id', progressionAdminController.upsertRank)
router.post('/ranks/:rankId/requirements', progressionAdminController.upsertRankRequirement)
router.put('/requirements/:id', progressionAdminController.upsertRankRequirement)
router.post('/ranks/:rankId/rewards', progressionAdminController.upsertRankReward)
router.put('/rewards/:id', progressionAdminController.upsertRankReward)
router.post('/bonuses', progressionAdminController.upsertBonus)
router.put('/bonuses/:id', progressionAdminController.upsertBonus)
router.post('/bonus-rules', progressionAdminController.upsertBonusRule)
router.put('/bonus-rules/:id', progressionAdminController.upsertBonusRule)
router.post('/campaigns', progressionAdminController.upsertCampaign)
router.put('/campaigns/:id', progressionAdminController.upsertCampaign)
router.post('/force-promotion', progressionAdminController.forcePromotion)
router.post('/simulate-bonus', progressionAdminController.simulateBonus)
router.post('/leaderboards/:key/refresh', progressionAdminController.refreshLeaderboard)
router.post('/bonuses/run-periodic', progressionAdminController.runPeriodicBonuses)

export { router as progressionAdminRouter }
