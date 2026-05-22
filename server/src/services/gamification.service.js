import { supabase } from '../lib/supabase.js'
import { progressionEngine } from './progressionEngine.service.js'
import { pearlsService } from './pearls.service.js'
import { getWeekKey } from './pearls.service.js'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export const gamificationService = {
  async getHub(userId) {
    await progressionEngine.ensureProgress(userId)

    const { data: g } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: levels } = await supabase
      .from('game_level_definitions')
      .select('*')
      .order('level')

    const { data: prestigeDefs } = await supabase
      .from('game_prestige_definitions')
      .select('*')
      .order('sort_order')

    let season = null
    if (g?.season_id) {
      const { data: seasonRow } = await supabase
        .from('game_seasons')
        .select('*')
        .eq('id', g.season_id)
        .single()
      season = seasonRow
    }

    const { data: activeEvents } = await supabase
      .from('game_limited_events')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString())

    const xpGlobal = g?.xp_global ?? g?.xp ?? 0
    let currentLevel = levels?.[0]
    let nextLevel = null
    for (const l of levels || []) {
      if (xpGlobal >= l.xp_required) currentLevel = l
      else if (!nextLevel) nextLevel = l
    }
    const nextReq = nextLevel?.xp_required ?? currentLevel?.xp_required ?? 0
    const curReq = currentLevel?.xp_required ?? 0
    const pct =
      nextLevel && nextReq > curReq
        ? Math.min(100, ((xpGlobal - curReq) / (nextReq - curReq)) * 100)
        : 100

    const { data: achievements } = await supabase
      .from('game_achievement_definitions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    const { data: earnedAch } = await supabase
      .from('game_user_achievements')
      .select('achievement_key, unlocked_at')
      .eq('user_id', userId)

    const earnedMap = Object.fromEntries(
      (earnedAch || []).map((e) => [e.achievement_key, e.unlocked_at])
    )

    const today = todayKey()
    const weekKey = getWeekKey()
    const { data: missions } = await supabase
      .from('game_mission_definitions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    const { data: missionProgress } = await supabase
      .from('game_user_missions')
      .select('*')
      .eq('user_id', userId)

    const progressMap = {}
    for (const p of missionProgress || []) {
      progressMap[`${p.mission_id}:${p.period_key}`] = p
    }

    const missionsWithProgress = (missions || []).map((m) => {
      const periodKey =
        m.mission_type === 'daily'
          ? today
          : m.mission_type === 'weekly'
            ? weekKey
            : m.mission_type === 'monthly'
              ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
              : `season-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      const prog = progressMap[`${m.id}:${periodKey}`]
      return {
        ...m,
        period_key: periodKey,
        current_count: prog?.current_count ?? 0,
        is_completed: prog?.is_completed ?? false,
        reward_claimed: prog?.reward_claimed ?? false,
      }
    })

    const { data: streaks } = await supabase
      .from('game_user_streaks')
      .select('*, game_streak_definitions(label, milestone_json)')
      .eq('user_id', userId)

    const { data: titles } = await supabase
      .from('game_user_titles')
      .select('*, game_title_definitions(*)')
      .eq('user_id', userId)

    const { data: cosmetics } = await supabase
      .from('game_user_cosmetics')
      .select('*, game_cosmetic_definitions(*)')
      .eq('user_id', userId)

    const { data: boosters } = await supabase
      .from('game_user_boosters')
      .select('*, game_booster_definitions(label, booster_type)')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())

    let pearlsWallet = null
    try {
      pearlsWallet = await pearlsService.getWallet(userId)
    } catch {
      /* optional */
    }

    const prestigeDef = (prestigeDefs || []).find((p) => p.tier_key === (g?.prestige_tier || 'none'))
    const nextPrestige = (prestigeDefs || []).find(
      (p) => p.sort_order > (prestigeDef?.sort_order ?? -1)
    )

    return {
      progress: {
        xp_global: xpGlobal,
        xp_seasonal: g?.xp_seasonal ?? 0,
        xp_team: g?.xp_team ?? 0,
        xp_leadership: g?.xp_leadership ?? 0,
        level: g?.level ?? 1,
        prestige_tier: g?.prestige_tier || 'none',
        prestige_count: g?.prestige_count ?? 0,
        streak_days: g?.streak_days ?? 0,
        equipped_title_key: g?.equipped_title_key,
        equipped_frame_key: g?.equipped_frame_key,
        equipped_theme_key: g?.equipped_theme_key,
        profile_card_json: g?.profile_card_json ?? {},
      },
      level: {
        current: currentLevel,
        next: nextLevel,
        pct,
        xpToNext: Math.max(0, (nextLevel?.xp_required ?? xpGlobal) - xpGlobal),
      },
      prestige: { current: prestigeDef, next: nextPrestige },
      season,
      active_events: activeEvents || [],
      achievements: (achievements || []).map((a) => ({
        ...a,
        unlocked: !!earnedMap[a.key],
        unlocked_at: earnedMap[a.key] || null,
      })),
      missions: missionsWithProgress,
      streaks: streaks || [],
      titles: titles || [],
      cosmetics: cosmetics || [],
      boosters: boosters || [],
      pearls: pearlsWallet,
      levels_catalog: levels || [],
      prestige_catalog: prestigeDefs || [],
    }
  },

  async compareUsers(viewerId, targetUserId) {
    const [viewer, target] = await Promise.all([
      this.getHub(viewerId),
      this.getHub(targetUserId),
    ])
    return {
      viewer: {
        level: viewer.progress.level,
        xp_global: viewer.progress.xp_global,
        prestige_tier: viewer.progress.prestige_tier,
        achievements_unlocked: viewer.achievements.filter((a) => a.unlocked).length,
      },
      target: {
        level: target.progress.level,
        xp_global: target.progress.xp_global,
        prestige_tier: target.progress.prestige_tier,
        achievements_unlocked: target.achievements.filter((a) => a.unlocked).length,
      },
      delta: {
        xp: target.progress.xp_global - viewer.progress.xp_global,
        level: target.progress.level - viewer.progress.level,
        achievements:
          target.achievements.filter((a) => a.unlocked).length -
          viewer.achievements.filter((a) => a.unlocked).length,
      },
    }
  },

  async equipCosmetic(userId, cosmeticKey) {
    const { data: owned } = await supabase
      .from('game_user_cosmetics')
      .select('cosmetic_key, game_cosmetic_definitions(cosmetic_type)')
      .eq('user_id', userId)
      .eq('cosmetic_key', cosmeticKey)
      .single()

    if (!owned) throw new Error('Cosmetic not owned')

    const type = owned.game_cosmetic_definitions?.cosmetic_type
    await supabase
      .from('game_user_cosmetics')
      .update({ is_equipped: false })
      .eq('user_id', userId)

    await supabase
      .from('game_user_cosmetics')
      .update({ is_equipped: true })
      .eq('user_id', userId)
      .eq('cosmetic_key', cosmeticKey)

    const updates = { updated_at: new Date().toISOString() }
    if (type === 'frame') updates.equipped_frame_key = cosmeticKey
    if (type === 'profile_theme') updates.equipped_theme_key = cosmeticKey
    if (type === 'background') {
      updates.profile_card_json = { background_key: cosmeticKey }
    }

    await supabase.from('user_gamification').update(updates).eq('user_id', userId)
    return { equipped: cosmeticKey, type }
  },

  async equipTitle(userId, titleKey) {
    const { data: owned } = await supabase
      .from('game_user_titles')
      .select('title_key')
      .eq('user_id', userId)
      .eq('title_key', titleKey)
      .maybeSingle()

    if (!owned) throw new Error('Title not unlocked')

    await supabase
      .from('game_user_titles')
      .update({ is_equipped: false })
      .eq('user_id', userId)

    await supabase
      .from('game_user_titles')
      .update({ is_equipped: true })
      .eq('user_id', userId)
      .eq('title_key', titleKey)

    await supabase
      .from('user_gamification')
      .update({ equipped_title_key: titleKey })
      .eq('user_id', userId)

    return { equipped: titleKey }
  },

  async purchaseCosmetic(userId, cosmeticKey) {
    const { data: def } = await supabase
      .from('game_cosmetic_definitions')
      .select('*')
      .eq('key', cosmeticKey)
      .eq('is_active', true)
      .single()

    if (!def) throw new Error('Cosmetic not found')
    if (def.is_limited && def.available_until && new Date(def.available_until) < new Date()) {
      throw new Error('This cosmetic is no longer available')
    }

    const claimRef = `cosmetic:${cosmeticKey}:${userId}`
    const { error: dup } = await supabase.from('game_reward_claims').insert({
      user_id: userId,
      claim_type: 'cosmetic_purchase',
      claim_ref: claimRef,
    })
    if (dup && /duplicate|unique/i.test(dup.message)) {
      throw new Error('Already owned')
    }

    if (def.pearl_cost > 0) {
      await pearlsService.ensureWallet(userId)
      const { data: wallet } = await supabase
        .from('pearls_wallet')
        .select('available_balance, lifetime_used')
        .eq('user_id', userId)
        .single()
      if ((wallet?.available_balance || 0) < def.pearl_cost) {
        throw new Error('Insufficient Pearls balance')
      }
      const newBalance = wallet.available_balance - def.pearl_cost
      await supabase
        .from('pearls_wallet')
        .update({
          available_balance: newBalance,
          lifetime_used: (wallet.lifetime_used || 0) + def.pearl_cost,
        })
        .eq('user_id', userId)
      await supabase.from('pearls_transactions').insert({
        user_id: userId,
        type: 'spend',
        source: 'cosmetic_shop',
        amount: -def.pearl_cost,
        balance_after: newBalance,
        reference_id: null,
        meta: { cosmetic_key: cosmeticKey },
      })
    }

    await supabase.from('game_user_cosmetics').upsert(
      { user_id: userId, cosmetic_key: cosmeticKey, acquired_via: 'pearls' },
      { onConflict: 'user_id,cosmetic_key' }
    )

    return def
  },

  async getLeaderboard(key, periodKey = 'all') {
    await progressionEngine.refreshLeaderboard(key, periodKey)
    const { data } = await supabase
      .from('game_leaderboard_entries')
      .select('*')
      .eq('leaderboard_key', key)
      .eq('period_key', periodKey)
      .order('rank_position')
      .limit(50)
    return data || []
  },

  async listLeaderboards() {
    const { data } = await supabase
      .from('game_leaderboard_definitions')
      .select('*')
      .eq('is_active', true)
    return data || []
  },
}
