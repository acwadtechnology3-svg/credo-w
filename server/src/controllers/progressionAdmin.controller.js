import { supabase } from '../lib/supabase.js'
import { rankProgressionEngine } from '../services/rankProgressionEngine.service.js'
import { bonusEngine } from '../services/bonusEngine.service.js'
import { progressionV8Service } from '../services/progressionV8.service.js'
import { logAdminAction } from '../lib/adminAudit.js'

export const progressionAdminController = {
  async overview(req, res) {
    try {
      const [ranks, bonuses, campaigns, achievements] = await Promise.all([
        supabase.from('ranks').select('id, name, sort_order, is_active').order('sort_order'),
        supabase.from('bonuses').select('id, bonus_key, name, is_active').order('sort_order'),
        supabase
          .from('seasonal_campaigns')
          .select('*')
          .order('starts_at', { ascending: false })
          .limit(10),
        supabase
          .from('game_achievement_definitions')
          .select('achievement_key, title_en, category, is_active')
          .order('sort_order')
          .limit(50),
      ])
      return res.json({
        ranks: ranks.data || [],
        bonuses: bonuses.data || [],
        campaigns: campaigns.data || [],
        achievements: achievements.data || [],
      })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  },

  async upsertRank(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('ranks')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      await logAdminAction({
        actorId: req.user.userId,
        action: 'P8_UPDATE_RANK',
        entity: 'ranks',
        entityId: req.params.id,
        newValue: data,
      })
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('ranks').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  async upsertRankRequirement(req, res) {
    const body = { ...req.body, rank_id: req.body.rank_id || req.params.rankId }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('rank_requirements')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('rank_requirements').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  async upsertRankReward(req, res) {
    const body = { ...req.body, rank_id: req.body.rank_id || req.params.rankId }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('rank_rewards')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('rank_rewards').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  async upsertBonus(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('bonuses')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('bonuses').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  async upsertBonusRule(req, res) {
    const body = { ...req.body }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('bonus_rules')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('bonus_rules').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  async upsertCampaign(req, res) {
    const body = { ...req.body }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('seasonal_campaigns')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('seasonal_campaigns').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  async forcePromotion(req, res) {
    const { userId, rankId, notes } = req.body
    if (!userId || !rankId) return res.status(400).json({ error: 'userId and rankId required' })
    const result = await rankProgressionEngine.promoteUser(userId, {
      forceRankId: rankId,
      actorId: req.user.userId,
      notes,
    })
    await logAdminAction({
      actorId: req.user.userId,
      action: 'P8_FORCE_PROMOTION',
      entity: 'users',
      entityId: userId,
      newValue: result,
    })
    return res.json({ success: true, result })
  },

  async simulateBonus(req, res) {
    const { bonusKey, sampleMetrics } = req.body
    const sim = await bonusEngine.simulatePayout(bonusKey, sampleMetrics || {})
    return res.json(sim)
  },

  async refreshLeaderboard(req, res) {
    const { key } = req.params
    const result = await progressionV8Service.refreshLeaderboard(key)
    return res.json(result)
  },

  async runPeriodicBonuses(req, res) {
    const period = req.body.period || 'weekly'
    const result = await bonusEngine.runPeriodicBonuses(period)
    return res.json({ success: true, ...result })
  },
}
