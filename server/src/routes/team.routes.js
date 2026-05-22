import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { teamController } from '../controllers/team.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/check-availability', teamController.checkReferralAvailability)
router.post('/new-referral', teamController.createReferral)
router.get('/referrals', teamController.getReferrals)
router.get('/genealogy', teamController.getGenealogy)
router.get('/placement-tree', teamController.getPlacementTree)
router.get('/members/:userId', teamController.getTeamMember)
router.post('/members/:userId/notify', teamController.notifyTeamMember)
router.get('/bv', teamController.getBusinessVolume)
router.get('/pv', teamController.getPersonalVolume)
export { router as teamRouter }
