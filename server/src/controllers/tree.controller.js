import { treeAccessService } from '../services/treeAccess.service.js'
import { joinRequestsService } from '../services/joinRequests.service.js'
import { treeOnboardingService } from '../services/treeOnboarding.service.js'
import { networkEngineService } from '../services/networkEngine.service.js'
import { placementEngineService } from '../services/placementEngine.service.js'
import { supabase } from '../lib/supabase.js'

export const treeController = {
  async getAccess(req, res) {
    try {
      let ctx = await treeAccessService.getUserTreeContext(req.user.userId)

      if (ctx.hasActivePackage && !ctx.hasTreeNode && ctx.pendingPlacement?.sponsor_id) {
        try {
          const { treeActivationService } = await import('../services/treeActivation.service.js')
          await treeActivationService.activateForUser(req.user.userId)
          ctx = await treeAccessService.getUserTreeContext(req.user.userId)
        } catch (e) {
          console.warn('[tree] auto-activate', e.message)
        }
      }
      const preview = await treeOnboardingService.getVisualizationConfig()
      const onboarding = await treeOnboardingService.getProgress(req.user.userId)

      const growthPreview = {
        potentialMatchingBv: 2400,
        leftLegBv: 1200,
        rightLegBv: 800,
        estimatedCommissionEgp: 480,
        rankProgressPct: 34,
      }

      res.json({
        ...ctx,
        growthPreview,
        visualizationConfig: preview,
        onboarding,
      })
    } catch (e) {
      console.error('[tree] access', e)
      res.status(500).json({ error: e.message })
    }
  },

  async createJoinRequest(req, res) {
    try {
      const { sponsorId, sponsorCode, agencyId, placementSide, message } = req.body
      let resolvedSponsorId = sponsorId

      if (!resolvedSponsorId && sponsorCode) {
        const { data: sponsor } = await supabase
          .from('users')
          .select('id')
          .eq('user_code', String(sponsorCode).trim())
          .maybeSingle()
        if (!sponsor) return res.status(400).json({ error: 'رمز الراعي غير صالح' })
        resolvedSponsorId = sponsor.id
      }

      const row = await joinRequestsService.createRequest(req.user.userId, {
        sponsorId: resolvedSponsorId,
        agencyId,
        placementSide,
        message,
      })
      res.status(201).json({ request: row })
    } catch (e) {
      const status = e.status || 500
      res.status(status).json({ error: e.message, code: e.code })
    }
  },

  async listJoinRequests(req, res) {
    try {
      const role = req.query.role === 'sponsor' ? 'sponsor' : 'requester'
      const requests = await joinRequestsService.listForUser(req.user.userId, { role })
      res.json({ requests })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async approveJoinRequest(req, res) {
    try {
      const result = await joinRequestsService.approve(req.params.id, req.user.userId)
      res.json(result)
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message, code: e.code })
    }
  },

  async rejectJoinRequest(req, res) {
    try {
      const result = await joinRequestsService.reject(
        req.params.id,
        req.user.userId,
        req.body?.reason
      )
      res.json(result)
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message })
    }
  },

  async cancelJoinRequest(req, res) {
    try {
      const result = await joinRequestsService.cancel(req.params.id, req.user.userId)
      res.json(result)
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message })
    }
  },

  async getOnboarding(req, res) {
    try {
      const data = await treeOnboardingService.getProgress(req.user.userId)
      res.json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async completeOnboardingStep(req, res) {
    try {
      const { stepKey } = req.body
      if (!stepKey) return res.status(400).json({ error: 'stepKey required' })
      const result = await treeOnboardingService.completeStep(req.user.userId, stepKey)
      res.json(result)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async skipOnboarding(req, res) {
    try {
      const result = await treeOnboardingService.skipToActivation(req.user.userId)
      res.json(result)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  /** Super admin — list/update onboarding steps */
  async adminListSteps(req, res) {
    try {
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*')
        .order('sort_order')
      if (error) throw error
      res.json({ steps: data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async adminUpsertStep(req, res) {
    try {
      const step = await treeOnboardingService.upsertStep(req.body)
      res.json({ step })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getAnalytics(req, res) {
    try {
      const analytics = await networkEngineService.getAnalytics(req.user.userId)
      res.json({ analytics })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getActivity(req, res) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', req.user.userId)
        .single()
      const feed = await networkEngineService.getActivityFeed({
        agencyId: user?.agency_id,
        userId: req.user.userId,
        limit: parseInt(req.query.limit, 10) || 40,
      })
      res.json({ feed })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async getEntrySession(req, res) {
    try {
      const session = await networkEngineService.getEntrySession(req.user.userId)
      res.json({ session })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async saveEntryStep(req, res) {
    try {
      const {
        step,
        hasInviteCode,
        joinUnderAgency,
        agencyId,
        sponsorId,
        sponsorCode,
        expansionSide,
        placementMode,
      } = req.body

      let resolvedSponsorId = sponsorId
      if (!resolvedSponsorId && sponsorCode) {
        const { data: sp } = await supabase
          .from('users')
          .select('id')
          .eq('user_code', String(sponsorCode).trim())
          .maybeSingle()
        if (!sp) return res.status(400).json({ error: 'رمز الدعوة غير صالح' })
        resolvedSponsorId = sp.id
      }

      const session = await networkEngineService.upsertEntrySession(req.user.userId, {
        current_step: step ?? 1,
        has_invite_code: hasInviteCode,
        join_under_agency: joinUnderAgency,
        agency_id: agencyId,
        sponsor_id: resolvedSponsorId,
        sponsor_code: sponsorCode,
        expansion_side: expansionSide,
        placement_mode: placementMode,
      })
      res.json({ session })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async previewPlacement(req, res) {
    try {
      const { sponsorId, sponsorCode, strategy, manualSide, agencyId } = req.body
      let sid = sponsorId
      if (!sid && sponsorCode) {
        const { data: sp } = await supabase
          .from('users')
          .select('id')
          .eq('user_code', String(sponsorCode).trim())
          .maybeSingle()
        if (!sp) return res.status(400).json({ error: 'رمز الراعي غير صالح' })
        sid = sp.id
      }
      if (!sid) return res.status(400).json({ error: 'الراعي مطلوب' })

      const preview = await placementEngineService.previewPlacement({
        sponsorUserId: sid,
        strategy,
        manualSide,
        agencyId,
      })
      res.json({ preview })
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message })
    }
  },

  async completeEntry(req, res) {
    try {
      const ctx = await treeAccessService.getUserTreeContext(req.user.userId)
      if (!ctx.hasActivePackage) {
        return res.status(403).json({ error: 'يجب تفعيل باقة أولاً للانضمام إلى المنظومة.', code: 'NO_PACKAGE' })
      }

      const session = await networkEngineService.getEntrySession(req.user.userId)
      const sponsorId = req.body.sponsorId || session?.sponsor_id
      if (!sponsorId && !ctx.hasTreeNode) {
        return res.status(400).json({ error: 'حدد الراعي أو كود الدعوة' })
      }

      const result = await networkEngineService.completeEntry(req.user.userId, {
        sponsorId,
        placementSide: req.body.placementSide || session?.expansion_side || 'AUTO',
        placementMode: req.body.placementMode || session?.placement_mode || 'AUTO',
        agencyId: req.body.agencyId || session?.agency_id,
      })
      res.json(result)
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message })
    }
  },

  async adminNetworkOverview(req, res) {
    try {
      const q = (req.query.q || '').trim()
      const results = q ? await networkEngineService.adminSearchNetwork(q) : []
      const { count: nodeCount } = await supabase
        .from('network_nodes')
        .select('*', { count: 'exact', head: true })
      const { data: settings } = await supabase
        .from('network_placement_settings')
        .select('*')
        .eq('scope', 'global')
        .is('agency_id', null)
        .maybeSingle()
      res.json({ nodeCount: nodeCount || 0, settings, searchResults: results })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async adminMovePlacement(req, res) {
    try {
      const { userId, newParentUserId, side, reason } = req.body
      if (!userId || !newParentUserId) {
        return res.status(400).json({ error: 'userId and newParentUserId required' })
      }
      const node = await networkEngineService.adminMovePlacement({
        userId,
        newParentUserId,
        side,
        adminUserId: req.user.userId,
        reason,
      })
      res.json({ node })
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message })
    }
  },

  async adminFreezeNode(req, res) {
    try {
      const { userId, frozen = true, reason } = req.body
      await networkEngineService.adminFreezeNode(userId, {
        frozen,
        reason,
        adminUserId: req.user.userId,
      })
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async adminSimulatePlacement(req, res) {
    try {
      const { sponsorId, strategy, manualSide, agencyId } = req.body
      if (!sponsorId) return res.status(400).json({ error: 'sponsorId required' })
      const preview = await placementEngineService.simulatePlacement({
        sponsorUserId: sponsorId,
        strategy,
        manualSide,
        agencyId,
      })
      res.json({ preview })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async adminPlacementSettings(req, res) {
    try {
      if (req.method === 'GET' || !req.body?.default_strategy) {
        const settings = await placementEngineService.getDefaultStrategy(req.body?.agency_id)
        return res.json({ settings })
      }
      const { default_strategy, allow_manual, config_json, agency_id } = req.body
      const { data, error } = await supabase
        .from('network_placement_settings')
        .upsert(
          {
            scope: agency_id ? 'agency' : 'global',
            agency_id: agency_id || null,
            default_strategy,
            allow_manual: allow_manual !== false,
            config_json: config_json || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'scope,agency_id' }
        )
        .select()
        .single()
      if (error) throw error
      res.json({ settings: data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },

  async adminVisualizationConfig(req, res) {
    try {
      const { config_key = 'default', config_json, label, is_active } = req.body
      const { data, error } = await supabase
        .from('tree_visualization_configs')
        .upsert(
          {
            config_key,
            config_json: config_json || {},
            label,
            is_active: is_active !== false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'config_key' }
        )
        .select()
        .single()
      if (error) throw error
      res.json({ config: data })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },
}
