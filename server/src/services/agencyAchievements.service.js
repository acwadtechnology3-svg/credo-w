import { supabase } from '../lib/supabase.js'
import { pearlsService } from './pearls.service.js'
import { agencyReputationService } from './agencyReputation.service.js'

export const agencyAchievementsService = {
  async checkAndUnlock(agencyId) {
    const { data: agency } = await supabase.from('agencies').select('*').eq('id', agencyId).single()
    if (!agency) return []

    const { data: defs } = await supabase.from('agency_achievement_definitions').select('*')
    const { data: unlocked } = await supabase
      .from('agency_achievements_unlocked')
      .select('achievement_key')
      .eq('agency_id', agencyId)
    const have = new Set((unlocked || []).map((u) => u.achievement_key))
    const newly = []

    for (const d of defs || []) {
      if (have.has(d.key)) continue
      let ok = false
      switch (d.condition_type) {
        case 'members':
          ok = (agency.total_members || 0) >= d.condition_value
          break
        case 'total_bv':
          ok = parseFloat(agency.total_bv || 0) >= d.condition_value
          break
        case 'invite_conversions':
          ok = (agency.invite_conversions || 0) >= d.condition_value
          break
        case 'rank_level':
        case 'team_level':
          ok = (agency.rank_level || agency.level || 1) >= d.condition_value
          break
        case 'prestige_score':
          ok = (agency.prestige_score || 0) >= d.condition_value
          break
        default:
          break
      }
      if (!ok) continue

      await supabase.from('agency_achievements_unlocked').insert({
        agency_id: agencyId,
        achievement_key: d.key,
      })
      const ownerId = agency.owner_id || agency.founder_id
      if (d.pearl_reward > 0 && ownerId) {
        try {
          await pearlsService.earn(ownerId, 'agency_achievement', d.pearl_reward, {
            agency_id: agencyId,
            achievement: d.key,
          })
        } catch {
          /* optional */
        }
      }
      await agencyReputationService.adjust(agencyId, 5, `achievement:${d.key}`)
      newly.push(d)
    }

    return newly
  },

  async listForAgency(agencyId) {
    const { data: defs } = await supabase
      .from('agency_achievement_definitions')
      .select('*')
      .order('sort_order')
    const { data: unlocked } = await supabase
      .from('agency_achievements_unlocked')
      .select('achievement_key, unlocked_at')
      .eq('agency_id', agencyId)
    const map = Object.fromEntries((unlocked || []).map((u) => [u.achievement_key, u.unlocked_at]))
    return (defs || []).map((d) => ({
      ...d,
      is_unlocked: !!map[d.key],
      unlocked_at: map[d.key] || null,
    }))
  },
}
