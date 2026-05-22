import { supabase } from '../lib/supabase.js'
import {
  createAgency,
  getAgencyLeaderboard,
  getUserAgency,
  joinAgency,
  leaveAgency,
} from '../services/agencies.service.js'
import { agencyFoundationService } from '../services/agencyFoundation.service.js'
import { agencyAchievementsService } from '../services/agencyAchievements.service.js'
import { hasAgencyPermission } from '../lib/agencyRoles.js'

export const agenciesController = {
  async listLeaderboard(req, res) {
    try {
      const limit = Math.min(50, parseInt(req.query.limit, 10) || 20)
      const ranking = req.query.metric || 'power_score'
      const agencies = await getAgencyLeaderboard(limit, ranking)
      return res.json({ agencies })
    } catch (err) {
      console.error('agency leaderboard:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getMyAgency(req, res) {
    try {
      const agency = await getUserAgency(req.user.userId)
      const onboarding = agency
        ? await agencyFoundationService.getOnboardingContext(req.user.userId)
        : null
      return res.json({ agency, onboarding })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async getProfile(req, res) {
    try {
      const profile = await agencyFoundationService.getAgencyProfile(req.params.slug)
      if (!profile) return res.status(404).json({ error: 'Agency not found' })
      return res.json({ agency: profile })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async discover(req, res) {
    try {
      const agencies = await agencyFoundationService.getDiscovery({
        region: req.query.region,
        category: req.query.category,
        featured: req.query.featured === 'true',
        limit: parseInt(req.query.limit, 10) || 30,
      })
      return res.json({ agencies })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async getAnalytics(req, res) {
    try {
      const data = await agencyFoundationService.getAgencyAnalytics(
        req.params.agencyId,
        req.user.userId
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 403).json({ error: err.message })
    }
  },

  async getOnboarding(req, res) {
    try {
      const ctx = await agencyFoundationService.getOnboardingContext(req.user.userId)
      if (!ctx) return res.status(404).json({ error: 'Not in an agency' })
      return res.json(ctx)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async completeOnboarding(req, res) {
    try {
      const ctx = await agencyFoundationService.completeOnboarding(req.user.userId, req.body)
      return res.json(ctx)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async getAchievements(req, res) {
    try {
      const { data: membership } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', req.user.userId)
        .eq('status', 'active')
        .maybeSingle()
      if (!membership) return res.json({ achievements: [] })
      const achievements = await agencyAchievementsService.listForAgency(membership.agency_id)
      return res.json({ achievements })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async createInvite(req, res) {
    try {
      const { agency_id } = req.body
      const agencyId = agency_id || req.params.agencyId
      const result = await agencyFoundationService.createRecruiterInvite(
        agencyId,
        req.user.userId,
        req.body
      )
      return res.status(201).json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async join(req, res) {
    try {
      const { agency_id } = req.body
      if (!agency_id) return res.status(400).json({ error: 'agency_id required' })
      const agency = await joinAgency(req.user.userId, agency_id, req.body)
      await agencyFoundationService.logActivity(agency_id, req.user.userId, 'member_joined', {})
      await agencyAchievementsService.checkAndUnlock(agency_id)
      return res.json({ agency })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async leave(req, res) {
    try {
      await leaveAgency(req.user.userId)
      return res.json({ message: 'Left agency' })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async updateMemberRole(req, res) {
    try {
      const { role } = req.body
      const agencyId = req.params.agencyId
      const targetUserId = req.params.userId

      const { data: actor } = await supabase
        .from('agency_members')
        .select('role')
        .eq('agency_id', agencyId)
        .eq('user_id', req.user.userId)
        .single()

      if (!hasAgencyPermission(actor?.role, 'assign_roles')) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      await supabase
        .from('agency_members')
        .update({ role })
        .eq('agency_id', agencyId)
        .eq('user_id', targetUserId)

      await agencyFoundationService.logActivity(agencyId, req.user.userId, 'role_changed', {
        targetUserId,
        role,
      })

      return res.json({ message: 'Role updated' })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  /** Admin-only: create official agency */
  async adminCreate(req, res) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.userId)
        .single()

      const result = await createAgency(req.user.userId, user?.role, req.body)
      return res.status(201).json({ success: true, ...result })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async adminUpdate(req, res) {
    try {
      const patch = { ...req.body, updated_at: new Date().toISOString() }
      delete patch.id
      const { data, error } = await supabase
        .from('agencies')
        .update(patch)
        .eq('id', req.params.agencyId)
        .select()
        .single()
      if (error) throw error
      await agencyFoundationService.logActivity(
        req.params.agencyId,
        req.user.userId,
        'agency_admin_update',
        { fields: Object.keys(patch) }
      )
      return res.json({ agency: data })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async adminList(req, res) {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return res.json({ agencies: data || [] })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },
}
