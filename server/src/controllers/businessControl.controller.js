import { supabase } from '../lib/supabase.js'
import { logAdminAction } from '../lib/adminAudit.js'
import { snapshotConfigVersion } from '../lib/configVersion.js'
import { invalidateRulesCache } from '../services/rulesEngine.service.js'

function audit(req, action, entity, entityId, oldVal, newVal) {
  return logAdminAction({
    actorId: req.user.userId,
    action,
    entity,
    entityId,
    oldValue: oldVal,
    newValue: newVal,
    ipAddress: req.ip,
  })
}

export const businessControlController = {
  // ─── Packages Studio ─────────────────────────────────────────────
  async listPackages(req, res) {
    const { data, error } = await supabase.from('packages').select('*').order('sort_order')
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async upsertPackage(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data: old } = await supabase.from('packages').select('*').eq('id', req.params.id).single()
      const { data, error } = await supabase.from('packages').update(body).eq('id', req.params.id).select().single()
      if (error) return res.status(400).json({ error: error.message })
      await snapshotConfigVersion('package', req.params.id, old, req.user.userId, 'admin_edit')
      invalidateRulesCache()
      await audit(req, 'BC_UPDATE_PACKAGE', 'packages', req.params.id, old, data)
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('packages').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    invalidateRulesCache()
    await audit(req, 'BC_CREATE_PACKAGE', 'packages', data.id, null, data)
    return res.status(201).json({ success: true, data })
  },

  // ─── Upgrade graph ─────────────────────────────────────────────────
  async listUpgradeRules(req, res) {
    const { data, error } = await supabase
      .from('package_upgrade_rules')
      .select('*, packages(id, name, package_level, price_egp, is_upgrade_only)')
      .order('from_membership_level')
      .order('priority', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async upsertUpgradeRule(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data: old } = await supabase
        .from('package_upgrade_rules')
        .select('*')
        .eq('id', req.params.id)
        .single()
      const { data, error } = await supabase
        .from('package_upgrade_rules')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      invalidateRulesCache()
      await audit(req, 'BC_UPDATE_UPGRADE_RULE', 'package_upgrade_rules', req.params.id, old, data)
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase
      .from('package_upgrade_rules')
      .insert(body)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    invalidateRulesCache()
    await audit(req, 'BC_CREATE_UPGRADE_RULE', 'package_upgrade_rules', data.id, null, data)
    return res.status(201).json({ success: true, data })
  },

  async deleteUpgradeRule(req, res) {
    const { data: old } = await supabase
      .from('package_upgrade_rules')
      .select('*')
      .eq('id', req.params.id)
      .single()
    await supabase.from('package_upgrade_rules').update({ is_active: false }).eq('id', req.params.id)
    invalidateRulesCache()
    await audit(req, 'BC_DELETE_UPGRADE_RULE', 'package_upgrade_rules', req.params.id, old, null)
    return res.json({ success: true })
  },

  // ─── Ranks ───────────────────────────────────────────────────────
  async listRanks(req, res) {
    const { data: ranks, error } = await supabase.from('ranks').select('*').order('sort_order')
    if (error) return res.status(500).json({ error: error.message })

    const { data: reqs } = await supabase.from('rank_requirements').select('*')
    const { data: rewards } = await supabase.from('rank_rewards').select('*')

    const enriched = (ranks || []).map((r) => ({
      ...r,
      requirements: (reqs || []).filter((x) => x.rank_id === r.id),
      rewards: (rewards || []).filter((x) => x.rank_id === r.id),
    }))
    return res.json({ success: true, data: enriched })
  },

  async upsertRank(req, res) {
    const { requirements, rewards, ...rankBody } = req.body
    if (req.params.id) {
      const { data: old } = await supabase.from('ranks').select('*').eq('id', req.params.id).single()
      const { data, error } = await supabase
        .from('ranks')
        .update(rankBody)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      await snapshotConfigVersion('rank', req.params.id, old, req.user.userId)
      if (Array.isArray(requirements)) {
        for (const reqRow of requirements) {
          await supabase.from('rank_requirements').upsert({
            rank_id: req.params.id,
            requirement_key: reqRow.requirement_key,
            requirement_value: reqRow.requirement_value,
            is_active: true,
          })
        }
      }
      if (Array.isArray(rewards)) {
        for (const rw of rewards) {
          await supabase.from('rank_rewards').upsert({
            rank_id: req.params.id,
            reward_key: rw.reward_key,
            reward_value: rw.reward_value,
            reward_meta: rw.reward_meta || {},
            is_active: true,
          })
        }
      }
      await audit(req, 'BC_UPDATE_RANK', 'ranks', req.params.id, old, data)
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('ranks').insert(rankBody).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  // ─── Payment methods ─────────────────────────────────────────────
  async listPaymentMethods(req, res) {
    const { data, error } = await supabase
      .from('payment_methods_config')
      .select('*')
      .order('sort_order')
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async upsertPaymentMethod(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data: old } = await supabase
        .from('payment_methods_config')
        .select('*')
        .eq('id', req.params.id)
        .single()
      const { data, error } = await supabase
        .from('payment_methods_config')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      await audit(req, 'BC_UPDATE_PAYMENT', 'payment_methods_config', req.params.id, old, data)
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase
      .from('payment_methods_config')
      .insert(body)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  // ─── Promotions ──────────────────────────────────────────────────
  async listPromotions(req, res) {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, promotion_rules(*)')
      .order('starts_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async upsertPromotion(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('promotions')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      await audit(req, 'BC_UPDATE_PROMO', 'promotions', req.params.id, null, data)
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('promotions').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  // ─── Feature flags ─────────────────────────────────────────────────
  async listFeatureFlags(req, res) {
    const { data, error } = await supabase.from('feature_flags').select('*').order('flag_key')
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async upsertFeatureFlag(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data: old } = await supabase.from('feature_flags').select('*').eq('id', req.params.id).single()
      const { data, error } = await supabase
        .from('feature_flags')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      invalidateRulesCache()
      await audit(req, 'BC_UPDATE_FLAG', 'feature_flags', req.params.id, old, data)
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('feature_flags').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    invalidateRulesCache()
    return res.status(201).json({ success: true, data })
  },

  // ─── UI config ───────────────────────────────────────────────────
  async listUiConfig(req, res) {
    const { data, error } = await supabase.from('ui_configurations').select('*').order('config_group')
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async upsertUiConfig(req, res) {
    const body = { ...req.body, updated_at: new Date().toISOString() }
    if (req.params.id) {
      const { data, error } = await supabase
        .from('ui_configurations')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true, data })
    }
    const { data, error } = await supabase.from('ui_configurations').insert(body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ success: true, data })
  },

  // ─── Team & wallet rules ─────────────────────────────────────────
  async listTeamRules(req, res) {
    const { data } = await supabase.from('team_policy_rules').select('*').order('rule_key')
    return res.json({ success: true, data: data || [] })
  },

  async upsertTeamRule(req, res) {
    const { rule_key, value_json, is_active = true } = req.body
    const { data, error } = await supabase
      .from('team_policy_rules')
      .upsert(
        { rule_key, value_json, is_active, updated_at: new Date().toISOString() },
        { onConflict: 'rule_key' }
      )
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    invalidateRulesCache()
    return res.json({ success: true, data })
  },

  async listWalletRules(req, res) {
    const { data } = await supabase.from('wallet_rules_config').select('*').order('rule_key')
    return res.json({ success: true, data: data || [] })
  },

  async upsertWalletRule(req, res) {
    const { rule_key, wallet_type, value_json, is_active = true } = req.body
    const { data, error } = await supabase
      .from('wallet_rules_config')
      .upsert(
        { rule_key, wallet_type, value_json, is_active, updated_at: new Date().toISOString() },
        { onConflict: 'rule_key' }
      )
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ success: true, data })
  },

  // ─── Audit & versions ────────────────────────────────────────────
  async listAuditLogs(req, res) {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, actor:actor_id(username, full_name)')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async listConfigVersions(req, res) {
    const { entity_type, entity_id } = req.query
    let q = supabase.from('config_version_snapshots').select('*').order('version', { ascending: false })
    if (entity_type) q = q.eq('entity_type', entity_type)
    if (entity_id) q = q.eq('entity_id', entity_id)
    const { data, error } = await q.limit(20)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, data: data || [] })
  },

  async getOverview(req, res) {
    const [packages, rules, ranks, flags, promos] = await Promise.all([
      supabase.from('packages').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('package_upgrade_rules').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('ranks').select('*', { count: 'exact', head: true }),
      supabase.from('feature_flags').select('*', { count: 'exact', head: true }).eq('is_enabled', true),
      supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ])
    return res.json({
      success: true,
      overview: {
        activePackages: packages.count ?? 0,
        activeUpgradeRules: rules.count ?? 0,
        ranks: ranks.count ?? 0,
        enabledFlags: flags.count ?? 0,
        activePromotions: promos.count ?? 0,
      },
    })
  },
}
