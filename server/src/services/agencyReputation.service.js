import { supabase } from '../lib/supabase.js'

export const agencyReputationService = {
  async adjust(agencyId, delta, reason, meta = {}) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('reputation_score, trust_level, prestige_score, fraud_score')
      .eq('id', agencyId)
      .single()

    if (!agency) return null

    const scoreAfter = Math.max(0, Math.min(100, (agency.reputation_score || 50) + delta))
    let trustLevel = agency.trust_level
    if (scoreAfter >= 80) trustLevel = 'trusted'
    else if (scoreAfter >= 60) trustLevel = 'established'
    else if (scoreAfter >= 40) trustLevel = 'growing'
    else if (scoreAfter < 25) trustLevel = 'at_risk'

    await supabase
      .from('agencies')
      .update({ reputation_score: scoreAfter, trust_level: trustLevel })
      .eq('id', agencyId)

    await supabase.from('agency_reputation_logs').insert({
      agency_id: agencyId,
      delta,
      reason,
      score_after: scoreAfter,
      meta,
    })

    return { reputation_score: scoreAfter, trust_level: trustLevel }
  },

  async bumpActivity(agencyId, points = 5) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('activity_score')
      .eq('id', agencyId)
      .single()
    const next = (agency?.activity_score || 0) + points
    await supabase.from('agencies').update({ activity_score: next }).eq('id', agencyId)
    return next
  },

  calcPrestigeTier(prestigeScore) {
    if (prestigeScore >= 10000) return 'diamond'
    if (prestigeScore >= 5000) return 'platinum'
    if (prestigeScore >= 2000) return 'gold'
    if (prestigeScore >= 500) return 'silver'
    return 'bronze'
  },

  calcAgencyRankKey(rankLevel) {
    const map = { 1: 'rising', 2: 'growth', 3: 'elite', 4: 'diamond', 5: 'royal', 6: 'legendary' }
    return map[rankLevel] || 'rising'
  },
}
