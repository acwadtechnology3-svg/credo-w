import { supabase } from '../lib/supabase.js'
import { pearlsService } from './pearls.service.js'
import { teamReputationService } from './teamReputation.service.js'

export const teamAchievementsService = {
  async checkAndUnlock(teamId) {
    const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
    if (!team) return []

    const { data: defs } = await supabase.from('team_achievement_definitions').select('*')
    const { data: unlocked } = await supabase
      .from('team_achievements_unlocked')
      .select('achievement_key')
      .eq('team_id', teamId)
    const have = new Set((unlocked || []).map((u) => u.achievement_key))
    const newly = []

    for (const d of defs || []) {
      if (have.has(d.key)) continue
      let ok = false
      switch (d.condition_type) {
        case 'members':
          ok = (team.total_members || 0) >= d.condition_value
          break
        case 'total_bv':
          ok = parseFloat(team.total_bv || 0) >= d.condition_value
          break
        case 'invite_conversions':
          ok = (team.invite_conversions || 0) >= d.condition_value
          break
        case 'team_level':
          ok = (team.level || 1) >= d.condition_value
          break
        case 'prestige_score':
          ok = (team.prestige_score || 0) >= d.condition_value
          break
        default:
          break
      }
      if (!ok) continue

      await supabase.from('team_achievements_unlocked').insert({
        team_id: teamId,
        achievement_key: d.key,
      })
      if (d.pearl_reward > 0 && team.founder_id) {
        try {
          await pearlsService.earn(team.founder_id, 'team_achievement', d.pearl_reward, {
            team_id: teamId,
            achievement: d.key,
          })
        } catch {
          /* optional */
        }
      }
      await teamReputationService.adjust(teamId, 5, `achievement:${d.key}`)
      newly.push(d)
    }

    return newly
  },

  async listForTeam(teamId) {
    const { data: defs } = await supabase
      .from('team_achievement_definitions')
      .select('*')
      .order('sort_order')
    const { data: unlocked } = await supabase
      .from('team_achievements_unlocked')
      .select('achievement_key, unlocked_at')
      .eq('team_id', teamId)
    const map = Object.fromEntries((unlocked || []).map((u) => [u.achievement_key, u.unlocked_at]))
    return (defs || []).map((d) => ({
      ...d,
      is_unlocked: !!map[d.key],
      unlocked_at: map[d.key] || null,
    }))
  },
}
