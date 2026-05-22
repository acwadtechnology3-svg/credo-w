import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { organizationController } from '../controllers/organization.controller.js'

export const organizationRouter = Router()
organizationRouter.use(authMiddleware)

organizationRouter.get('/hub', organizationController.getHub)
organizationRouter.get('/activity', organizationController.getActivityFeed)
organizationRouter.get('/identity', organizationController.getIdentity)
organizationRouter.get('/missions', organizationController.getMissions)
organizationRouter.post('/missions/claim', organizationController.claimMission)
organizationRouter.get('/leaderboards/:key', organizationController.getLeaderboard)

organizationRouter.get('/tree/flow', organizationController.getTreeFlow)
organizationRouter.get('/tree/search', organizationController.searchTree)
organizationRouter.get('/tree/nodes/:nodeId/children', organizationController.getTreeNodeChildren)
organizationRouter.get('/tree/members/:userId', organizationController.getMemberCard)
