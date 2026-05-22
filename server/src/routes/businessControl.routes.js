import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { businessControlController } from '../controllers/businessControl.controller.js'
import { invitationsController } from '../controllers/invitations.controller.js'

const router = Router()
router.use(authMiddleware)
router.use(roleGuard('super_admin'))

router.get('/overview', businessControlController.getOverview)

router.get('/packages', businessControlController.listPackages)
router.post('/packages', businessControlController.upsertPackage)
router.put('/packages/:id', businessControlController.upsertPackage)

router.get('/upgrade-rules', businessControlController.listUpgradeRules)
router.post('/upgrade-rules', businessControlController.upsertUpgradeRule)
router.put('/upgrade-rules/:id', businessControlController.upsertUpgradeRule)
router.delete('/upgrade-rules/:id', businessControlController.deleteUpgradeRule)

router.get('/ranks', businessControlController.listRanks)
router.post('/ranks', businessControlController.upsertRank)
router.put('/ranks/:id', businessControlController.upsertRank)

router.get('/payment-methods', businessControlController.listPaymentMethods)
router.post('/payment-methods', businessControlController.upsertPaymentMethod)
router.put('/payment-methods/:id', businessControlController.upsertPaymentMethod)

router.get('/promotions', businessControlController.listPromotions)
router.post('/promotions', businessControlController.upsertPromotion)
router.put('/promotions/:id', businessControlController.upsertPromotion)

router.get('/feature-flags', businessControlController.listFeatureFlags)
router.post('/feature-flags', businessControlController.upsertFeatureFlag)
router.put('/feature-flags/:id', businessControlController.upsertFeatureFlag)

router.get('/ui-config', businessControlController.listUiConfig)
router.post('/ui-config', businessControlController.upsertUiConfig)
router.put('/ui-config/:id', businessControlController.upsertUiConfig)

router.get('/team-rules', businessControlController.listTeamRules)
router.put('/team-rules', businessControlController.upsertTeamRule)

router.get('/wallet-rules', businessControlController.listWalletRules)
router.put('/wallet-rules', businessControlController.upsertWalletRule)

router.get('/invitation-settings', invitationsController.getAdminSettings)
router.put('/invitation-settings', invitationsController.updateAdminSettings)

router.get('/audit-logs', businessControlController.listAuditLogs)
router.get('/config-versions', businessControlController.listConfigVersions)

export { router as businessControlRouter }
