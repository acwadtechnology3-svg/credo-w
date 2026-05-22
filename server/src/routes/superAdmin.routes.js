import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { superAdminController } from '../controllers/superAdmin.controller.js'

const router = Router()
router.use(authMiddleware)
router.use(roleGuard('super_admin'))

router.get('/packages', superAdminController.getPackages)
router.post('/packages', superAdminController.createPackage)
router.put('/packages/:id', superAdminController.updatePackage)
router.delete('/packages/:id', superAdminController.deletePackage)

router.get('/ranks', superAdminController.getRanks)
router.post('/ranks', superAdminController.createRank)
router.put('/ranks/:id', superAdminController.updateRank)

router.get('/level-bonus', superAdminController.getLevelBonusSettings)
router.put('/level-bonus', superAdminController.updateLevelBonus)

router.get('/settings', superAdminController.getFinancialSettings)
router.put('/settings/:key', superAdminController.updateFinancialSetting)

router.get('/admins', superAdminController.getAdmins)
router.post('/admins', superAdminController.createAdmin)
router.put('/admins/:id/role', superAdminController.updateAdminRole)

router.post('/maintenance', superAdminController.setMaintenanceMode)
router.post('/commission/reverse', superAdminController.reverseCommission)
router.post('/bv/grant', superAdminController.grantBV)
router.get('/platform-stats', superAdminController.getPlatformStats)

export { router as superAdminRouter }
