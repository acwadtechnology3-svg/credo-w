import { organizationActivityService } from '../services/organizationActivity.service.js'
import { organizationGamificationService } from '../services/organizationGamification.service.js'
import { treeNetworkService } from '../services/treeNetwork.service.js'
import { supabase } from '../lib/supabase.js'

export const organizationController = {
  async getHub(req, res) {
    try {
      const userId = req.user.userId
      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id, role, agencies(id, name, slug, theme_color)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      const agencyId = member?.agency_id || null
      const [feed, profile, recruiterBoard, prestigeBoard] = await Promise.all([
        organizationActivityService.getFeed({ agencyId, userId, limit: 25 }),
        organizationGamificationService.getMemberProfile(userId, agencyId),
        organizationGamificationService.getLeaderboard('monthly_recruiter', { limit: 10 }),
        organizationGamificationService.getLeaderboard('agency_prestige', { agencyId, limit: 10 }),
      ])

      res.json({
        agency: member?.agencies ? { ...member.agencies, myRole: member.role } : null,
        feed,
        profile,
        leaderboards: { recruiters: recruiterBoard, prestige: prestigeBoard },
      })
    } catch (e) {
      console.error('[org] hub', e)
      res.status(500).json({ error: e.message })
    }
  },

  async getActivityFeed(req, res) {
    try {
      const { agencyId, limit, cursor, types } = req.query
      const eventTypes = types ? types.split(',') : null
      const feed = await organizationActivityService.getFeed({
        agencyId: agencyId || null,
        userId: req.user.userId,
        limit: Math.min(parseInt(limit, 10) || 40, 80),
        cursor,
        eventTypes,
      })
      res.json(feed)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getTreeFlow(req, res) {
    try {
      const maxDepth = Math.min(parseInt(req.query.depth, 10) || 4, 6)
      const expanded = req.query.expanded ? req.query.expanded.split(',') : []
      const graph = await treeNetworkService.buildFlowGraph(req.user.userId, {
        maxDepth,
        expandedIds: expanded.map((id) => id.trim()).filter(Boolean),
      })
      res.json(graph)
    } catch (e) {
      console.error('[org] tree-flow', e)
      res.status(500).json({ error: e.message })
    }
  },

  async getTreeNodeChildren(req, res) {
    try {
      const children = await treeNetworkService.loadChildren(req.params.nodeId, {
        depth: parseInt(req.query.depth, 10) || 1,
      })
      res.json({ children })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getMemberCard(req, res) {
    try {
      const card = await treeNetworkService.getMemberCard(req.params.userId, {
        actorUserId: req.user.userId,
      })
      if (!card) return res.status(404).json({ error: 'Member not found' })
      res.json({ member: card })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async searchTree(req, res) {
    try {
      const results = await treeNetworkService.searchNetwork(req.user.userId, req.query.q)
      res.json({ results })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getMissions(req, res) {
    try {
      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', req.user.userId)
        .eq('status', 'active')
        .maybeSingle()
      const profile = await organizationGamificationService.getMemberProfile(
        req.user.userId,
        member?.agency_id
      )
      res.json({ missions: profile.missions })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async claimMission(req, res) {
    try {
      const { missionId, periodKey } = req.body
      const { data: mission } = await supabase
        .from('agency_missions')
        .select('*')
        .eq('id', missionId)
        .single()
      if (!mission) return res.status(404).json({ error: 'Mission not found' })

      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', req.user.userId)
        .maybeSingle()

      await organizationGamificationService.claimMissionReward(
        req.user.userId,
        mission,
        member?.agency_id,
        periodKey
      )
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', req.user.userId)
        .maybeSingle()
      const board = await organizationGamificationService.getLeaderboard(req.params.key, {
        agencyId: member?.agency_id,
        limit: parseInt(req.query.limit, 10) || 25,
      })
      res.json(board)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getIdentity(req, res) {
    try {
      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id, role')
        .eq('user_id', req.user.userId)
        .eq('status', 'active')
        .maybeSingle()
      const profile = await organizationGamificationService.getMemberProfile(
        req.user.userId,
        member?.agency_id
      )
      const card = await treeNetworkService.getMemberCard(req.user.userId)
      res.json({ ...profile, tree: card, agencyRole: member?.role })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },
}
