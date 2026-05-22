import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { progressionController } from '../controllers/progression.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/career', progressionController.getCareerHub)
router.get('/career/path', progressionController.getCareerPath)
router.get('/rank-history', progressionController.getRankHistory)
router.get('/bonuses', progressionController.getBonusHistory)
router.get('/leaderboards/:key', progressionController.getLeaderboard)
router.get('/prestige/:userId', progressionController.getPublicPrestige)
router.post('/rank/refresh', progressionController.refreshMyRank)

export { router as progressionRouter }
