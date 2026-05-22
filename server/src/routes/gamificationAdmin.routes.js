import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { gamificationAdminController } from '../controllers/gamificationAdmin.controller.js'

const router = Router()
router.use(authMiddleware)
router.use(roleGuard('super_admin'))

router.get('/overview', gamificationAdminController.overview)
router.get('/xp-rules', gamificationAdminController.listXpRules)
router.post('/xp-rules', gamificationAdminController.upsertXpRule)
router.put('/xp-rules', gamificationAdminController.upsertXpRule)
router.get('/missions', gamificationAdminController.listMissions)
router.post('/missions', gamificationAdminController.upsertMission)
router.put('/missions', gamificationAdminController.upsertMission)
router.get('/achievements', gamificationAdminController.listAchievements)
router.post('/achievements', gamificationAdminController.upsertAchievement)
router.put('/achievements', gamificationAdminController.upsertAchievement)
router.get('/seasons', gamificationAdminController.listSeasons)
router.post('/seasons', gamificationAdminController.upsertSeason)
router.put('/seasons', gamificationAdminController.upsertSeason)
router.get('/events', gamificationAdminController.listEvents)
router.post('/events', gamificationAdminController.upsertEvent)
router.put('/events', gamificationAdminController.upsertEvent)
router.put('/config', gamificationAdminController.updateConfig)
router.post('/xp-rollback', gamificationAdminController.rollbackXp)

export { router as gamificationAdminRouter }
