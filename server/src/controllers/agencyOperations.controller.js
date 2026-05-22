import { supabase } from '../lib/supabase.js'
import { agencyOperationsService } from '../services/agencyOperations.service.js'
import { agencyJoinRequestsService } from '../services/agencyJoinRequests.service.js'
import { agencyInvitationOpsService } from '../services/agencyInvitationOps.service.js'
import { agencyOnboardingEngine } from '../services/agencyOnboardingEngine.service.js'
import { agencyDashboardService } from '../services/agencyDashboard.service.js'
import { agencyTreeDataService } from '../services/agencyTreeData.service.js'
import { agencyPlacementService } from '../services/agencyPlacement.service.js'
import { agencyAdminOpsService } from '../services/agencyAdminOps.service.js'
import { agencyPackageGateService } from '../services/agencyPackageGate.service.js'
import { agencySponsorService } from '../services/agencySponsor.service.js'

async function platformRole(userId) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single()
  return data?.role
}

export const agencyOperationsController = {
  // ── Agency lifecycle (staff) ──
  async adminCreate(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyOperationsService.create(req.user.userId, role, req.body)
      return res.status(201).json({ success: true, ...result })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminUpdate(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const agency = await agencyOperationsService.updateAgency(
        req.params.agencyId,
        req.user.userId,
        role,
        req.body
      )
      return res.json({ agency })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminDeactivate(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const agency = await agencyOperationsService.deactivate(
        req.params.agencyId,
        req.user.userId,
        role,
        req.body
      )
      return res.json({ agency })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async getSettings(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const settings = await agencyOperationsService.getSettings(
        req.params.agencyId,
        req.user.userId,
        role
      )
      return res.json({ settings })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async updateSettings(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const settings = await agencyOperationsService.updateSettings(
        req.params.agencyId,
        req.user.userId,
        role,
        req.body
      )
      return res.json({ settings })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async getSponsorChain(req, res) {
    try {
      const chain = await agencySponsorService.getSponsorChain(
        req.params.userId || req.user.userId
      )
      return res.json({ chain })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  // ── Placement ──
  async previewPlacement(req, res) {
    try {
      const { sponsorId, placementSide } = req.body
      const preview = await agencyPlacementService.previewPlacement(
        sponsorId || req.user.userId,
        placementSide
      )
      return res.json({ preview })
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message, code: err.code })
    }
  },

  async assignPlacement(req, res) {
    try {
      const { userId, sponsorId, placementSide, agencyId, forceActivate } = req.body
      const result = await agencyPlacementService.assignPlacement({
        userId: userId || req.user.userId,
        sponsorId,
        agencyId,
        placementSide,
        forceActivate,
      })
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message, code: err.code })
    }
  },

  async getPlacementContext(req, res) {
    try {
      const userId = req.params.userId || req.user.userId
      const ctx = await agencyPlacementService.getNodeContext(userId)
      return res.json(ctx)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  // ── Join requests ──
  async createJoinRequest(req, res) {
    try {
      const row = await agencyJoinRequestsService.create(req.user.userId, {
        agencyId: req.body.agency_id || req.params.agencyId,
        sponsorUserId: req.body.sponsor_user_id,
        placementSide: req.body.placement_side,
        message: req.body.message,
        inviteCode: req.body.invite_code,
      })
      return res.status(201).json({ request: row })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async listJoinRequests(req, res) {
    try {
      const rows = await agencyJoinRequestsService.listForAgency(
        req.params.agencyId,
        req.user.userId,
        { status: req.query.status || 'pending' }
      )
      return res.json({ requests: rows })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async listMyJoinRequests(req, res) {
    try {
      const rows = await agencyJoinRequestsService.listMine(req.user.userId)
      return res.json({ requests: rows })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async approveJoinRequest(req, res) {
    try {
      const row = await agencyJoinRequestsService.approve(req.params.requestId, req.user.userId)
      return res.json({ request: row })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async rejectJoinRequest(req, res) {
    try {
      const row = await agencyJoinRequestsService.reject(req.params.requestId, req.user.userId, {
        reason: req.body.reason,
      })
      return res.json({ request: row })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  // ── Invitations ──
  async getInviteCard(req, res) {
    try {
      const card = await agencyInvitationOpsService.getInviteCard(req.params.code)
      if (!card) return res.status(404).json({ error: 'Invite not found or expired' })
      await agencyInvitationOpsService.trackOpen(req.params.code)
      return res.json(card)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async createRecruiterInvite(req, res) {
    try {
      const result = await agencyInvitationOpsService.createRecruiterInvite(
        req.params.agencyId,
        req.user.userId,
        req.body
      )
      return res.status(201).json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async sendEmailInvite(req, res) {
    try {
      const result = await agencyInvitationOpsService.sendEmailInvite(
        req.params.agencyId,
        req.user.userId,
        req.body
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async inviteAnalytics(req, res) {
    try {
      const data = await agencyInvitationOpsService.getAgencyInviteAnalytics(
        req.params.agencyId,
        req.user.userId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async trackInviteClick(req, res) {
    try {
      await agencyInvitationOpsService.trackClick(req.params.code)
      return res.json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  // ── Onboarding engine ──
  async getJourneyOnboarding(req, res) {
    try {
      const data = await agencyOnboardingEngine.getProgress(req.user.userId)
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async completeJourneyStep(req, res) {
    try {
      const data = await agencyOnboardingEngine.completeStep(req.user.userId, req.body.step_key)
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message, code: err.code })
    }
  },

  // ── Dashboard ──
  async dashboardOverview(req, res) {
    try {
      const data = await agencyDashboardService.getOverview(req.params.agencyId, req.user.userId)
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardGrowth(req, res) {
    try {
      const data = await agencyDashboardService.getGrowthMetrics(
        req.params.agencyId,
        req.user.userId,
        { days: parseInt(req.query.days, 10) || 30 }
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardMonthly(req, res) {
    try {
      const data = await agencyDashboardService.getMonthlyStatistics(
        req.params.agencyId,
        req.user.userId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardLeaderboard(req, res) {
    try {
      const data = await agencyDashboardService.getRecruiterLeaderboard(
        req.params.agencyId,
        req.user.userId
      )
      return res.json({ leaderboard: data })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardRankProgress(req, res) {
    try {
      const data = await agencyDashboardService.getRankProgress(
        req.params.agencyId,
        req.user.userId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardDirectRecruits(req, res) {
    try {
      const data = await agencyDashboardService.getDirectRecruits(
        req.params.agencyId,
        req.user.userId,
        req.query.sponsor_id
      )
      return res.json({ recruits: data })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardPendingInvites(req, res) {
    try {
      const data = await agencyDashboardService.getPendingInvitations(
        req.params.agencyId,
        req.user.userId
      )
      return res.json({ invitations: data })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardPendingRequests(req, res) {
    try {
      const data = await agencyDashboardService.getPendingRequests(
        req.params.agencyId,
        req.user.userId
      )
      return res.json({ requests: data })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardLiveBv(req, res) {
    try {
      const data = await agencyDashboardService.getLiveBvStats(
        req.params.agencyId,
        req.user.userId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardCv(req, res) {
    try {
      const data = await agencyDashboardService.getCvStatistics(
        req.params.agencyId,
        req.user.userId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async dashboardTeamPower(req, res) {
    try {
      const data = await agencyDashboardService.getTeamPower(req.params.agencyId, req.user.userId)
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async memberDashboard(req, res) {
    try {
      const data = await agencyDashboardService.getMemberDashboard(req.user.userId)
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  // ── Tree data (3D prep) ──
  async treeNode(req, res) {
    try {
      const data = await agencyTreeDataService.getNode(
        req.user.userId,
        req.params.userId,
        req.params.agencyId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async treeSubtree(req, res) {
    try {
      const data = await agencyTreeDataService.getSubtree(
        req.user.userId,
        req.query.root_user_id || req.user.userId,
        { depth: parseInt(req.query.depth, 10) || 3, agencyId: req.params.agencyId }
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async treeExpand(req, res) {
    try {
      const data = await agencyTreeDataService.expandNode(
        req.user.userId,
        req.params.userId,
        req.params.agencyId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async treeCollapse(req, res) {
    try {
      const data = await agencyTreeDataService.collapseNode(
        req.user.userId,
        req.params.userId,
        req.params.agencyId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async treeSearch(req, res) {
    try {
      const data = await agencyTreeDataService.searchMembers(
        req.user.userId,
        req.params.agencyId,
        req.query.q
      )
      return res.json({ results: data })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async treeSponsorTrace(req, res) {
    try {
      const data = await agencyTreeDataService.traceSponsor(
        req.user.userId,
        req.params.userId,
        req.params.agencyId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async treePlacementViz(req, res) {
    try {
      const data = await agencyTreeDataService.getPlacementVisualization(
        req.user.userId,
        req.query.sponsor_id,
        req.query.placement_side
      )
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async treeAgencyScope(req, res) {
    try {
      const data = await agencyTreeDataService.getAgencyTreeScope(
        req.user.userId,
        req.params.agencyId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  // ── Package gate ──
  async participationGate(req, res) {
    try {
      const ctx = await agencyPackageGateService.getParticipationContext(req.user.userId)
      return res.json(ctx)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  // ── Super admin ops ──
  async adminMoveMember(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.moveMember(req.user.userId, role, req.body)
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminOverridePlacement(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.overridePlacement(
        req.user.userId,
        role,
        req.body
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message, code: err.code })
    }
  },

  async adminChangeSponsor(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.changeSponsor(req.user.userId, role, req.body)
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminEditBv(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.editBvManual(req.user.userId, role, req.body)
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminResetStructure(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.resetStructure(
        req.user.userId,
        role,
        req.params.agencyId
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminSpecialApprove(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.approveSpecialJoin(
        req.user.userId,
        role,
        req.params.requestId
      )
      return res.json({ request: result })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminImpersonate(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.impersonateContext(
        req.user.userId,
        role,
        req.params.agencyId
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminFreeze(req, res) {
    try {
      const role = await platformRole(req.user.userId)
      const result = await agencyAdminOpsService.freezeAgency(
        req.user.userId,
        role,
        req.params.agencyId
      )
      return res.json({ agency: result })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },
}
