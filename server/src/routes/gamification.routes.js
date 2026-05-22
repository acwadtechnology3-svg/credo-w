import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { gamificationController } from '../controllers/gamification.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/hub', gamificationController.getHub)
router.get('/leaderboards', gamificationController.getLeaderboards)
router.get('/leaderboards/:key', gamificationController.getLeaderboard)
router.get('/cosmetics', gamificationController.getCosmeticsCatalog)
router.get('/compare/:userId', gamificationController.compare)
router.post('/equip/cosmetic', gamificationController.equipCosmetic)
router.post('/equip/title', gamificationController.equipTitle)
router.post('/cosmetics/purchase', gamificationController.purchaseCosmetic)
router.post('/actions', gamificationController.triggerAction)

export { router as gamificationRouter }
