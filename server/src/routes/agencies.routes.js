import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleGuard } from '../middleware/role.middleware.js'
import { agenciesController } from '../controllers/agencies.controller.js'
import { agencyOperationsController } from '../controllers/agencyOperations.controller.js'
import { agencyGroupsRouter } from './agencyGroups.routes.js'

const router = Router()

// ── Public discovery ──
router.get('/leaderboard', agenciesController.listLeaderboard)
router.get('/discover', agenciesController.discover)
router.get('/browse', agenciesController.discover)
router.get('/profile/:slug', agenciesController.getProfile)
router.get('/invites/:code/card', agencyOperationsController.getInviteCard)
router.post('/invites/:code/click', agencyOperationsController.trackInviteClick)

router.use(authMiddleware)

// ── Agency communication & groups ──
router.use('/:agencyId/groups', agencyGroupsRouter)

// ── Member context ──
router.get('/mine', agenciesController.getMyAgency)
router.get('/dashboard/member', agencyOperationsController.memberDashboard)
router.get('/participation', agencyOperationsController.participationGate)

// ── Legacy foundation onboarding (cinematic profile) ──
router.get('/onboarding', agenciesController.getOnboarding)
router.post('/onboarding/complete', agenciesController.completeOnboarding)

// ── 10-step journey onboarding (post-package) ──
router.get('/journey/onboarding', agencyOperationsController.getJourneyOnboarding)
router.post('/journey/onboarding/step', agencyOperationsController.completeJourneyStep)

router.get('/achievements', agenciesController.getAchievements)
router.post('/join', agenciesController.join)
router.post('/leave', agenciesController.leave)

// ── Join requests (agency_join_requests) ──
router.get('/join-requests/mine', agencyOperationsController.listMyJoinRequests)
router.post('/:agencyId/join-requests', agencyOperationsController.createJoinRequest)
router.get('/:agencyId/join-requests', agencyOperationsController.listJoinRequests)
router.post('/join-requests/:requestId/approve', agencyOperationsController.approveJoinRequest)
router.post('/join-requests/:requestId/reject', agencyOperationsController.rejectJoinRequest)

// ── Sponsor genealogy ──
router.get('/sponsor/chain/:userId?', agencyOperationsController.getSponsorChain)

// ── Placement engine ──
router.get('/placement/context/:userId?', agencyOperationsController.getPlacementContext)
router.post('/placement/preview', agencyOperationsController.previewPlacement)
router.post('/placement/assign', agencyOperationsController.assignPlacement)

// ── Invitations (recruiter ops) ──
router.post('/:agencyId/invites', agencyOperationsController.createRecruiterInvite)
router.post('/:agencyId/invites/email', agencyOperationsController.sendEmailInvite)
router.get('/:agencyId/invites/analytics', agencyOperationsController.inviteAnalytics)
router.get('/:agencyId/analytics', agenciesController.getAnalytics)
router.patch('/:agencyId/members/:userId/role', agenciesController.updateMemberRole)

// ── Agency settings (leaders + platform) ──
router.get('/:agencyId/settings', agencyOperationsController.getSettings)
router.patch('/:agencyId/settings', agencyOperationsController.updateSettings)
router.post('/:agencyId/deactivate', agencyOperationsController.adminDeactivate)

// ── Dashboard APIs ──
router.get('/:agencyId/dashboard/overview', agencyOperationsController.dashboardOverview)
router.get('/:agencyId/dashboard/growth', agencyOperationsController.dashboardGrowth)
router.get('/:agencyId/dashboard/monthly', agencyOperationsController.dashboardMonthly)
router.get('/:agencyId/dashboard/recruiters', agencyOperationsController.dashboardLeaderboard)
router.get('/:agencyId/dashboard/rank-progress', agencyOperationsController.dashboardRankProgress)
router.get('/:agencyId/dashboard/direct-recruits', agencyOperationsController.dashboardDirectRecruits)
router.get('/:agencyId/dashboard/pending-invites', agencyOperationsController.dashboardPendingInvites)
router.get('/:agencyId/dashboard/pending-requests', agencyOperationsController.dashboardPendingRequests)
router.get('/:agencyId/dashboard/live-bv', agencyOperationsController.dashboardLiveBv)
router.get('/:agencyId/dashboard/cv', agencyOperationsController.dashboardCv)
router.get('/:agencyId/dashboard/team-power', agencyOperationsController.dashboardTeamPower)

// ── Live tree data (3D visualization prep) ──
router.get('/:agencyId/tree/scope', agencyOperationsController.treeAgencyScope)
router.get('/:agencyId/tree/search', agencyOperationsController.treeSearch)
router.get('/:agencyId/tree/placement-preview', agencyOperationsController.treePlacementViz)
router.get('/:agencyId/tree/node/:userId', agencyOperationsController.treeNode)
router.get('/:agencyId/tree/subtree', agencyOperationsController.treeSubtree)
router.get('/:agencyId/tree/expand/:userId', agencyOperationsController.treeExpand)
router.get('/:agencyId/tree/collapse/:userId', agencyOperationsController.treeCollapse)
router.get('/:agencyId/tree/sponsor-trace/:userId', agencyOperationsController.treeSponsorTrace)

// ── Platform admin: agency lifecycle ──
router.post('/admin/create', roleGuard('super_admin', 'admin'), agencyOperationsController.adminCreate)
router.get('/admin/list', roleGuard('super_admin', 'admin'), agenciesController.adminList)
router.patch('/admin/:agencyId', roleGuard('super_admin', 'admin'), agencyOperationsController.adminUpdate)

// ── Platform admin: operational overrides ──
router.post('/admin/members/move', roleGuard('super_admin', 'admin'), agencyOperationsController.adminMoveMember)
router.post('/admin/placement/override', roleGuard('super_admin', 'admin'), agencyOperationsController.adminOverridePlacement)
router.post('/admin/sponsor/change', roleGuard('super_admin', 'admin'), agencyOperationsController.adminChangeSponsor)
router.post('/admin/bv/adjust', roleGuard('super_admin', 'admin'), agencyOperationsController.adminEditBv)
router.post('/admin/:agencyId/reset-structure', roleGuard('super_admin', 'admin'), agencyOperationsController.adminResetStructure)
router.post('/admin/join-requests/:requestId/approve', roleGuard('super_admin', 'admin'), agencyOperationsController.adminSpecialApprove)
router.get('/admin/:agencyId/impersonate', roleGuard('super_admin', 'admin'), agencyOperationsController.adminImpersonate)
router.post('/admin/:agencyId/freeze', roleGuard('super_admin', 'admin'), agencyOperationsController.adminFreeze)

export { router as agenciesRouter }
