import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { treeController } from '../controllers/tree.controller.js'

export const treeRouter = Router()

treeRouter.use(authMiddleware)

treeRouter.get('/access', treeController.getAccess)
treeRouter.get('/onboarding', treeController.getOnboarding)
treeRouter.post('/onboarding/complete-step', treeController.completeOnboardingStep)
treeRouter.post('/onboarding/skip', treeController.skipOnboarding)

treeRouter.get('/join-requests', treeController.listJoinRequests)
treeRouter.post('/join-requests', treeController.createJoinRequest)
treeRouter.post('/join-requests/:id/approve', treeController.approveJoinRequest)
treeRouter.post('/join-requests/:id/reject', treeController.rejectJoinRequest)
treeRouter.post('/join-requests/:id/cancel', treeController.cancelJoinRequest)

treeRouter.get('/analytics', treeController.getAnalytics)
treeRouter.get('/activity', treeController.getActivity)
treeRouter.get('/entry', treeController.getEntrySession)
treeRouter.post('/entry/step', treeController.saveEntryStep)
treeRouter.post('/entry/preview-placement', treeController.previewPlacement)
treeRouter.post('/entry/complete', treeController.completeEntry)

treeRouter.get(
  '/admin/network',
  roleGuard(['super_admin', 'admin']),
  treeController.adminNetworkOverview
)
treeRouter.post(
  '/admin/move-placement',
  roleGuard(['super_admin']),
  treeController.adminMovePlacement
)
treeRouter.post(
  '/admin/freeze-node',
  roleGuard(['super_admin']),
  treeController.adminFreezeNode
)
treeRouter.post(
  '/admin/simulate-placement',
  roleGuard(['super_admin']),
  treeController.adminSimulatePlacement
)
treeRouter.get(
  '/admin/placement-settings',
  roleGuard(['super_admin']),
  treeController.adminPlacementSettings
)
treeRouter.put(
  '/admin/placement-settings',
  roleGuard(['super_admin']),
  treeController.adminPlacementSettings
)

treeRouter.get(
  '/admin/onboarding-steps',
  roleGuard(['super_admin']),
  treeController.adminListSteps
)
treeRouter.put(
  '/admin/onboarding-steps',
  roleGuard(['super_admin']),
  treeController.adminUpsertStep
)
treeRouter.put(
  '/admin/visualization-config',
  roleGuard(['super_admin']),
  treeController.adminVisualizationConfig
)
