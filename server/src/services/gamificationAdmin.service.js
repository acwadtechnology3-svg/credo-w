import { supabase } from '../lib/supabase.js'
import { progressionEngine } from './progressionEngine.service.js'
import { logAdminAction } from '../lib/adminAudit.js'

async function logAdminAudit(adminId, action, entityId, newValue) {
  await logAdminAction({
    actorId: adminId,
    action,
    entity: 'gamification',
    entityId,
    newValue,
  })
}

export const gamificationAdminService = {
  async getOverview() {
    const tables = [
      'game_xp_rules',
      'game_mission_definitions',
      'game_achievement_definitions',
      'game_cosmetic_definitions',
      'game_seasons',
      'game_limited_events',
    ]
    const counts = {}
    for (const t of tables) {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true })
      counts[t] = count ?? 0
    }
    const { data: config } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'gamification_config')
      .maybeSingle()
    return { counts, config: config?.value ?? {} }
  },

  async upsertXpRule(body, adminId) {
    const row = {
      event_key: body.event_key,
      label: body.label,
      xp_global: body.xp_global ?? 0,
      xp_seasonal: body.xp_seasonal ?? 0,
      xp_team: body.xp_team ?? 0,
      xp_leadership: body.xp_leadership ?? 0,
      pearl_bonus: body.pearl_bonus ?? 0,
      cooldown_seconds: body.cooldown_seconds ?? 0,
      max_per_hour: body.max_per_hour ?? 20,
      is_active: body.is_active !== false,
      meta: body.meta ?? {},
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('game_xp_rules')
      .upsert(row, { onConflict: 'event_key' })
      .select()
      .single()
    if (error) throw error
    progressionEngine.invalidateRulesCache()
    await logAdminAudit(adminId, 'gamification_xp_rule', body.event_key, row)
    return data
  },

  async upsertMission(body, adminId) {
    const row = {
      key: body.key,
      title: body.title,
      description: body.description,
      icon: body.icon ?? '🎯',
      mission_type: body.mission_type ?? 'daily',
      action_trigger: body.action_trigger,
      target_count: body.target_count ?? 1,
      xp_reward: body.xp_reward ?? 0,
      pearl_reward: body.pearl_reward ?? 0,
      booster_key: body.booster_key,
      cosmetic_reward_key: body.cosmetic_reward_key,
      min_level: body.min_level ?? 1,
      rarity: body.rarity ?? 'common',
      is_active: body.is_active !== false,
      sort_order: body.sort_order ?? 0,
      event_tag: body.event_tag,
    }
    const { data, error } = await supabase
      .from('game_mission_definitions')
      .upsert(row, { onConflict: 'key' })
      .select()
      .single()
    if (error) throw error
    await logAdminAudit(adminId, 'gamification_mission', body.key, row)
    return data
  },

  async upsertAchievement(body, adminId) {
    const row = {
      key: body.key,
      category: body.category,
      title: body.title,
      description: body.description,
      icon: body.icon ?? '🏆',
      rarity: body.rarity ?? 'common',
      condition_type: body.condition_type,
      condition_value: body.condition_value ?? 1,
      xp_reward: body.xp_reward ?? 0,
      pearl_reward: body.pearl_reward ?? 0,
      cosmetic_unlock_key: body.cosmetic_unlock_key,
      title_unlock_key: body.title_unlock_key,
      is_secret: !!body.is_secret,
      is_limited: !!body.is_limited,
      available_until: body.available_until,
      is_active: body.is_active !== false,
      sort_order: body.sort_order ?? 0,
    }
    const { data, error } = await supabase
      .from('game_achievement_definitions')
      .upsert(row, { onConflict: 'key' })
      .select()
      .single()
    if (error) throw error
    await logAdminAudit(adminId, 'gamification_achievement', body.key, row)
    return data
  },

  async upsertSeason(body, adminId) {
    const row = {
      key: body.key,
      name: body.name,
      description: body.description,
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      is_active: !!body.is_active,
      reset_seasonal_xp: body.reset_seasonal_xp !== false,
      theme_json: body.theme_json ?? {},
    }
    const { data, error } = await supabase
      .from('game_seasons')
      .upsert(row, { onConflict: 'key' })
      .select()
      .single()
    if (error) throw error
    await logAdminAudit(adminId, 'gamification_season', body.key, row)
    return data
  },

  async upsertLimitedEvent(body, adminId) {
    const row = {
      key: body.key,
      name: body.name,
      description: body.description,
      event_type: body.event_type ?? 'multiplier',
      multiplier: body.multiplier ?? 1.5,
      applies_to: body.applies_to ?? [],
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      is_active: body.is_active !== false,
      rewards_json: body.rewards_json ?? {},
    }
    const { data, error } = await supabase
      .from('game_limited_events')
      .upsert(row, { onConflict: 'key' })
      .select()
      .single()
    if (error) throw error
    await logAdminAudit(adminId, 'gamification_event', body.key, row)
    return data
  },

  async updateConfig(body, adminId) {
    const { data: existing } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'gamification_config')
      .maybeSingle()
    const merged = { ...(existing?.value || {}), ...body }
    await supabase
      .from('system_settings')
      .upsert({ key: 'gamification_config', value: merged })
    await logAdminAudit(adminId, 'gamification_config', 'gamification_config', merged)
    return merged
  },

  async listXpRules() {
    const { data } = await supabase.from('game_xp_rules').select('*').order('event_key')
    return data || []
  },

  async listMissions() {
    const { data } = await supabase
      .from('game_mission_definitions')
      .select('*')
      .order('sort_order')
    return data || []
  },

  async listAchievements() {
    const { data } = await supabase
      .from('game_achievement_definitions')
      .select('*')
      .order('sort_order')
    return data || []
  },

  async listSeasons() {
    const { data } = await supabase.from('game_seasons').select('*').order('starts_at', {
      ascending: false,
    })
    return data || []
  },

  async listEvents() {
    const { data } = await supabase
      .from('game_limited_events')
      .select('*')
      .order('starts_at', { ascending: false })
    return data || []
  },

  async rollbackXp(userId, ledgerId, adminId, reason) {
    const { data: entry } = await supabase
      .from('game_xp_ledger')
      .select('*')
      .eq('id', ledgerId)
      .eq('user_id', userId)
      .single()
    if (!entry) throw new Error('Ledger entry not found')

    const col =
      entry.xp_type === 'seasonal'
        ? 'xp_seasonal'
        : entry.xp_type === 'team'
          ? 'xp_team'
          : entry.xp_type === 'leadership'
            ? 'xp_leadership'
            : 'xp_global'

    const { data: g } = await supabase
      .from('user_gamification')
      .select(col)
      .eq('user_id', userId)
      .single()

    const newVal = Math.max(0, (g?.[col] || 0) - entry.amount)
    await supabase.from('user_gamification').update({ [col]: newVal }).eq('user_id', userId)

    await supabase.from('game_xp_ledger').insert({
      user_id: userId,
      xp_type: entry.xp_type,
      amount: -entry.amount,
      source: 'admin_rollback',
      meta: { rolled_back: ledgerId, reason },
      idempotency_key: `rollback:${ledgerId}`,
    })

    await logAdminAudit(adminId, 'xp_rollback', ledgerId, { userId, reason })
    await progressionEngine.syncLevelAndPrestige(userId)
    return { rolled_back: entry.amount, column: col, new_value: newVal }
  },
}
