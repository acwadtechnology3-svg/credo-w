import { supabase } from '../lib/supabase.js'

export const teamReputationService = {
  async adjust(teamId, delta, reason, meta = {}) {
    const { data: team } = await supabase
      .from('teams')
      .select('reputation_score, trust_level, prestige_score')
      .eq('id', teamId)
      .single()

    if (!team) return null

    const scoreAfter = Math.max(0, Math.min(100, (team.reputation_score || 50) + delta))
    let trustLevel = team.trust_level
    if (scoreAfter >= 80) trustLevel = 'trusted'
    else if (scoreAfter >= 60) trustLevel = 'established'
    else if (scoreAfter >= 40) trustLevel = 'growing'
    else if (scoreAfter < 25) trustLevel = 'at_risk'

    await supabase
      .from('teams')
      .update({ reputation_score: scoreAfter, trust_level: trustLevel })
      .eq('id', teamId)

    await supabase.from('team_reputation_logs').insert({
      team_id: teamId,
      delta,
      reason,
      score_after: scoreAfter,
      meta,
    })

    return { reputation_score: scoreAfter, trust_level: trustLevel }
  },

  async bumpActivity(teamId, points = 5) {
    const { data: team } = await supabase
      .from('teams')
      .select('activity_score')
      .eq('id', teamId)
      .single()
    const next = (team?.activity_score || 0) + points
    await supabase.from('teams').update({ activity_score: next }).eq('id', teamId)
    return next
  },

  calcPrestigeTier(prestigeScore) {
    if (prestigeScore >= 10000) return 'diamond'
    if (prestigeScore >= 5000) return 'platinum'
    if (prestigeScore >= 2000) return 'gold'
    if (prestigeScore >= 500) return 'silver'
    return 'bronze'
  },
}
