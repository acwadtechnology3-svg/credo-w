import { supabase } from '../lib/supabase.js'
import { progressionEngine } from './progressionEngine.service.js'
import { pearlsService, getWeekKey } from './pearls.service.js'
import { organizationActivityService } from './organizationActivity.service.js'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function monthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const organizationGamificationService = {
  async ensureMemberXp(userId, agencyId = null) {
    const { data } = await supabase
      .from('agency_member_xp')
      .select('id')
      .eq('user_id', userId)
      .eq('agency_id', agencyId)
      .maybeSingle()
    if (data) return data.id

    const { data: row, error } = await supabase
      .from('agency_member_xp')
      .insert({ user_id: userId, agency_id: agencyId })
      .select('id')
      .single()
    if (error) throw error
    return row.id
  },

  async grantXp(userId, { agencyId = null, amount, source, referenceId = null, idempotencyKey = null }) {
    if (!amount || amount <= 0) return null
    await this.ensureMemberXp(userId, agencyId)

    if (idempotencyKey) {
      const { data: dup } = await supabase
        .from('agency_xp_ledger')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (dup) return { duplicate: true }
    }

    await supabase.from('agency_xp_ledger').insert({
      user_id: userId,
      agency_id: agencyId,
      amount,
      source,
      reference_id: referenceId,
      idempotency_key: idempotencyKey,
    })

    const { data: cur } = await supabase
      .from('agency_member_xp')
      .select('xp_total, level, prestige_points')
      .eq('user_id', userId)
      .eq('agency_id', agencyId)
      .single()

    const newXp = (cur?.xp_total || 0) + amount
    const { data: levels } = await supabase
      .from('agency_member_levels')
      .select('*')
      .order('level', { ascending: false })

    let newLevel = 1
    for (const l of levels || []) {
      if (newXp >= l.xp_required) {
        newLevel = l.level
        break
      }
    }

    const leveledUp = newLevel > (cur?.level || 1)

    await supabase
      .from('agency_member_xp')
      .update({
        xp_total: newXp,
        level: newLevel,
        last_xp_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('agency_id', agencyId)

    const eventMap = {
      'mission:': 'mission_complete',
      package_purchased: 'package_purchase',
      referral_join: 'referral_join',
      onboarding_complete: 'onboarding_complete',
    }
    const eventKey = Object.entries(eventMap).find(([k]) => source.startsWith(k) || source === k)?.[1] || 'team_activity'
    await progressionEngine
      .grantXp(userId, eventKey, {
        referenceId,
        idempotencyKey: idempotencyKey ? `global:${idempotencyKey}` : undefined,
      })
      .catch(() => {})

    await this.syncPrestige(userId, agencyId)

    if (leveledUp) {
      await organizationActivityService.record({
        agencyId,
        eventType: 'rank_promoted',
        targetUserId: userId,
        title: `ترقية مستوى — المستوى ${newLevel}`,
        body: `وصلت إلى مستوى ${newLevel} في المنظمة`,
        payload: { level: newLevel, xp: newXp },
      })
    }

    return { xp: newXp, level: newLevel, leveledUp }
  },

  async syncPrestige(userId, agencyId = null) {
    const { data: mxp } = await supabase
      .from('agency_member_xp')
      .select('*')
      .eq('user_id', userId)
      .eq('agency_id', agencyId)
      .maybeSingle()

    if (!mxp) return null

    const { data: tiers } = await supabase
      .from('agency_prestige_tiers')
      .select('*')
      .order('sort_order', { ascending: false })

    let best = tiers?.[tiers.length - 1]
    for (const t of tiers || []) {
      if (
        mxp.level >= t.min_level &&
        mxp.xp_total >= t.min_xp &&
        mxp.prestige_points >= t.min_prestige_points
      ) {
        best = t
        break
      }
    }

    if (!best) return null

    await supabase.from('agency_member_prestige').upsert(
      {
        user_id: userId,
        agency_id: agencyId,
        tier_key: best.tier_key,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,agency_id' }
    )

    return best
  },

  async incrementMission(userId, actionTrigger, { agencyId = null, increment = 1 } = {}) {
    const today = todayKey()
    const weekKey = getWeekKey()
    const month = monthKey()

    const { data: missions } = await supabase
      .from('agency_missions')
      .select('*')
      .eq('is_active', true)
      .eq('action_trigger', actionTrigger)

    for (const m of missions || []) {
      if (m.agency_id && m.agency_id !== agencyId) continue
      const periodKey =
        m.mission_type === 'daily' ? today : m.mission_type === 'weekly' ? weekKey : month

      const { data: prog } = await supabase
        .from('agency_member_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', m.id)
        .eq('period_key', periodKey)
        .maybeSingle()

      const count = (prog?.current_count || 0) + increment
      const completed = count >= m.target_count

      if (prog) {
        await supabase
          .from('agency_member_missions')
          .update({
            current_count: count,
            is_completed: completed,
            completed_at: completed && !prog.is_completed ? new Date().toISOString() : prog.completed_at,
          })
          .eq('id', prog.id)
      } else {
        await supabase.from('agency_member_missions').insert({
          user_id: userId,
          mission_id: m.id,
          agency_id: agencyId,
          period_key: periodKey,
          current_count: count,
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
      }

      if (completed && !prog?.reward_claimed) {
        await this.claimMissionReward(userId, m, agencyId, periodKey)
      }
    }
  },

  async claimMissionReward(userId, mission, agencyId, periodKey) {
    await supabase
      .from('agency_member_missions')
      .update({ reward_claimed: true, claimed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .eq('period_key', periodKey)

    if (mission.xp_reward) {
      await this.grantXp(userId, {
        agencyId,
        amount: mission.xp_reward,
        source: `mission:${mission.key}`,
        idempotencyKey: `mission-xp:${mission.id}:${periodKey}:${userId}`,
      })
    }
    if (mission.pearl_reward) {
      await pearlsService.earn(userId, 'mission_complete', mission.pearl_reward, { mission: mission.key })
    }
    if (mission.prestige_points) {
      await supabase.rpc('increment_agency_prestige_points', {
        p_user_id: userId,
        p_agency_id: agencyId,
        p_delta: mission.prestige_points,
      }).catch(async () => {
        const { data: cur } = await supabase
          .from('agency_member_xp')
          .select('prestige_points')
          .eq('user_id', userId)
          .eq('agency_id', agencyId)
          .single()
        await supabase
          .from('agency_member_xp')
          .update({ prestige_points: (cur?.prestige_points || 0) + mission.prestige_points })
          .eq('user_id', userId)
          .eq('agency_id', agencyId)
      })
    }

    await organizationActivityService.record({
      agencyId,
      eventType: 'mission_completed',
      targetUserId: userId,
      title: `مهمة مكتملة: ${mission.title}`,
      payload: { missionKey: mission.key },
    })

    await progressionEngine.evaluateAchievements?.(userId).catch(() => {})
  },

  async getMemberProfile(userId, agencyId = null) {
    await this.ensureMemberXp(userId, agencyId)

    const { data: mxp } = await supabase
      .from('agency_member_xp')
      .select('*')
      .eq('user_id', userId)
      .eq('agency_id', agencyId)
      .maybeSingle()

    const { data: prestige } = await supabase
      .from('agency_member_prestige')
      .select('*, agency_prestige_tiers(*)')
      .eq('user_id', userId)
      .eq('agency_id', agencyId)
      .maybeSingle()

    const { data: g } = await supabase.from('user_gamification').select('*').eq('user_id', userId).maybeSingle()

    const today = todayKey()
    const weekKey = getWeekKey()
    const { data: missions } = await supabase.from('agency_missions').select('*').eq('is_active', true)
    const { data: progress } = await supabase
      .from('agency_member_missions')
      .select('*')
      .eq('user_id', userId)

    const progressMap = Object.fromEntries((progress || []).map((p) => [`${p.mission_id}:${p.period_key}`, p]))

    const missionsWithProgress = (missions || []).map((m) => {
      const pk =
        m.mission_type === 'daily' ? today : m.mission_type === 'weekly' ? weekKey : monthKey()
      const prog = progressMap[`${m.id}:${pk}`]
      return { ...m, period_key: pk, current_count: prog?.current_count ?? 0, is_completed: prog?.is_completed ?? false }
    })

    const { data: achievements } = await supabase
      .from('game_user_achievements')
      .select('achievement_key, unlocked_at, game_achievement_definitions(*)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(12)

    return {
      agencyXp: mxp,
      prestige: prestige?.agency_prestige_tiers
        ? { ...prestige, tier: prestige.agency_prestige_tiers }
        : prestige,
      globalGamification: g,
      missions: missionsWithProgress,
      achievements: achievements || [],
    }
  },

  async getLeaderboard(key, { agencyId = null, periodKey = null, limit = 25 } = {}) {
    const pk = periodKey || monthKey()
    const { data: entries } = await supabase
      .from('agency_leaderboard_entries')
      .select('*, users(id, username, full_name, profile_image, user_code)')
      .eq('leaderboard_key', key)
      .eq('period_key', pk)
      .order('score', { ascending: false })
      .limit(limit)

    if (entries?.length) return { key, periodKey: pk, entries }

    return this.refreshLeaderboard(key, { agencyId, periodKey: pk, limit })
  },

  async refreshLeaderboard(key, { agencyId = null, periodKey, limit = 25 } = {}) {
    const pk = periodKey || monthKey()
    let scores = []

    if (key.includes('recruiter')) {
      const { data: users } = await supabase
        .from('users')
        .select('id, direct_count, username, full_name, profile_image, user_code')
        .order('direct_count', { ascending: false })
        .limit(limit)
      scores = (users || []).map((u, i) => ({
        user_id: u.id,
        score: u.direct_count || 0,
        rank_position: i + 1,
        users: u,
      }))
    } else if (key === 'agency_prestige' || key === 'mission_score') {
      let q = supabase
        .from('agency_member_xp')
        .select('user_id, xp_total, prestige_points, mission_score, users(id, username, full_name, profile_image, user_code)')
        .order(key === 'mission_score' ? 'mission_score' : 'prestige_points', { ascending: false })
        .limit(limit)
      if (agencyId) q = q.eq('agency_id', agencyId)
      const { data } = await q
      scores = (data || []).map((r, i) => ({
        user_id: r.user_id,
        score: key === 'mission_score' ? r.mission_score : r.prestige_points,
        rank_position: i + 1,
        users: r.users,
      }))
    }

    for (const s of scores) {
      await supabase.from('agency_leaderboard_entries').upsert(
        {
          leaderboard_key: key,
          agency_id: agencyId,
          user_id: s.user_id,
          period_key: pk,
          score: s.score,
          rank_position: s.rank_position,
        },
        { onConflict: 'leaderboard_key,user_id,period_key,agency_id' }
      )
    }

    return { key, periodKey: pk, entries: scores }
  },
}
