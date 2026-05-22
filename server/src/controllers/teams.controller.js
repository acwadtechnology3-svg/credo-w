import { supabase } from '../lib/supabase.js'
import {
  canCreateTeam,
  createTeam,
  getTeamLeaderboard,
  getUserTeam,
  joinTeam,
  leaveTeam,
  recalcTeamStats,
} from '../services/teams.service.js'
import { teamFoundationService } from '../services/teamFoundation.service.js'
import { teamAchievementsService } from '../services/teamAchievements.service.js'
import { hasTeamPermission } from '../lib/teamRoles.js'

export const teamsController = {
  async listLeaderboard(req, res) {
    try {
      const limit = Math.min(50, parseInt(req.query.limit, 10) || 20)
      const teams = await getTeamLeaderboard(limit)
      return res.json({ teams })
    } catch (err) {
      console.error('listLeaderboard:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getMyTeam(req, res) {
    try {
      const team = await getUserTeam(req.user.userId)
      const foundation = await teamFoundationService.getStatus(req.user.userId)
      return res.json({ team, foundation })
    } catch (err) {
      console.error('getMyTeam:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getFoundationStatus(req, res) {
    try {
      const status = await teamFoundationService.getStatus(req.user.userId)
      return res.json(status)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async validateSlug(req, res) {
    try {
      const result = await teamFoundationService.validateSlug(req.query.slug)
      return res.json(result)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async establish(req, res) {
    return res.status(403).json({
      error:
        'Free team creation is no longer available. Join an official agency via invite link or contact Corporate Management.',
      code: 'AGENCY_ECOSYSTEM_ONLY',
    })
  },

  async create(req, res) {
    return res.status(403).json({
      error: 'Agencies are created by Super Admin / Corporate Management only. POST /api/agencies/admin/create',
      code: 'AGENCY_ADMIN_ONLY',
    })
  },

  async join(req, res) {
    try {
      const { team_id } = req.body
      if (!team_id) return res.status(400).json({ error: 'team_id required' })
      const team = await joinTeam(req.user.userId, team_id)
      await teamFoundationService.logActivity(team_id, req.user.userId, 'member_joined', {})
      await teamAchievementsService.checkAndUnlock(team_id)
      return res.json({ team })
    } catch (err) {
      console.error('joinTeam:', err)
      return res.status(err.status || 500).json({ error: err.message || 'Server error' })
    }
  },

  async leave(req, res) {
    try {
      await leaveTeam(req.user.userId)
      return res.json({ message: 'Left team' })
    } catch (err) {
      console.error('leaveTeam:', err)
      return res.status(err.status || 500).json({ error: err.message || 'Server error' })
    }
  },

  async listPublic(req, res) {
    try {
      const teams = await teamFoundationService.getDiscovery({
        type: req.query.type,
        limit: parseInt(req.query.limit, 10) || 30,
      })
      return res.json({ teams })
    } catch (err) {
      console.error('listPublic:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getProfile(req, res) {
    try {
      const profile = await teamFoundationService.getTeamProfile(req.params.slug)
      if (!profile) return res.status(404).json({ error: 'Team not found' })
      return res.json({ team: profile })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async getAnalytics(req, res) {
    try {
      const data = await teamFoundationService.getTeamAnalytics(req.params.teamId, req.user.userId)
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 403).json({ error: err.message })
    }
  },

  async getAchievements(req, res) {
    try {
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', req.user.userId)
        .maybeSingle()
      if (!membership) return res.json({ achievements: [] })
      const achievements = await teamAchievementsService.listForTeam(membership.team_id)
      return res.json({ achievements })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async completeOnboarding(req, res) {
    try {
      const { welcomed, viewed_intro, starter_missions_done } = req.body
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', req.user.userId)
        .single()
      if (!membership) return res.status(404).json({ error: 'Not in a team' })

      await supabase.from('team_member_onboarding').upsert({
        user_id: req.user.userId,
        team_id: membership.team_id,
        welcomed: welcomed ?? true,
        viewed_intro: viewed_intro ?? true,
        starter_missions_done: starter_missions_done ?? 0,
        completed_checklist: true,
        completed_at: new Date().toISOString(),
      })

      return res.json({ message: 'Onboarding saved' })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async updateMemberRole(req, res) {
    try {
      const { role } = req.body
      const teamId = req.params.teamId
      const targetUserId = req.params.userId

      const { data: actor } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', req.user.userId)
        .single()

      if (!hasTeamPermission(actor?.role, 'assign_roles')) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', targetUserId)

      await teamFoundationService.logActivity(teamId, req.user.userId, 'role_changed', {
        targetUserId,
        role,
      })

      return res.json({ message: 'Role updated' })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },
}
