import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { teamsController } from '../controllers/teams.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/leaderboard', teamsController.listLeaderboard)
router.get('/browse', teamsController.listPublic)
router.get('/discover', teamsController.listPublic)
router.get('/mine', teamsController.getMyTeam)
router.get('/foundation/status', teamsController.getFoundationStatus)
router.get('/foundation/validate-slug', teamsController.validateSlug)
router.post('/foundation/establish', teamsController.establish)
router.get('/achievements', teamsController.getAchievements)
router.post('/onboarding/complete', teamsController.completeOnboarding)
router.get('/profile/:slug', teamsController.getProfile)
router.get('/:teamId/analytics', teamsController.getAnalytics)
router.patch('/:teamId/members/:userId/role', teamsController.updateMemberRole)
router.post('/', teamsController.create)
router.post('/join', teamsController.join)
router.post('/leave', teamsController.leave)

export { router as teamsRouter }
