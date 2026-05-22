import { supabase } from '../../lib/supabase.js'
import { rankService } from '../rank.service.js'
import { emitToUser } from '../../lib/socket.js'

export const mlmRankEngine = {
  async evaluateAndSnapshot(userId, eventId = null) {
    const { data: before } = await supabase
      .from('users')
      .select('rank_id, ranks(name, sort_order)')
      .eq('id', userId)
      .single()

    const newRank = await rankService.checkAndUpdateRank(userId)

    const { data: after } = await supabase
      .from('users')
      .select('rank_id, ranks(id, name, sort_order)')
      .eq('id', userId)
      .single()

    const promoted =
      after?.ranks?.sort_order > (before?.ranks?.sort_order ?? 0)

    if (after?.rank_id) {
      await supabase.from('rank_snapshots').insert({
        user_id: userId,
        rank_id: after.rank_id,
        rank_name: after.ranks?.name,
        sort_order: after.ranks?.sort_order,
        event_id: eventId,
      })
    }

    const metrics = await import('./mlmMetrics.service.js').then((m) =>
      m.mlmMetricsService.computeUserMetrics(userId)
    )

    if (after?.rank_id) {
      await supabase.from('rank_qualifications').insert({
        user_id: userId,
        rank_id: after.rank_id,
        qualified: true,
        event_id: eventId,
        metrics_json: metrics,
      })
    }

    await supabase.from('qualification_logs').insert({
      user_id: userId,
      qualification_type: 'rank_evaluation',
      passed: promoted,
      event_id: eventId,
      details_json: { before: before?.ranks?.name, after: after?.ranks?.name, metrics },
    })

    if (promoted) {
      emitToUser(userId, 'mlm:rank_promoted', {
        rank: after.ranks?.name,
        eventId,
      })
    }

    return { promoted, rank: after?.ranks }
  },
}
