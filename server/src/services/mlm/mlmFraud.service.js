import { supabase } from '../../lib/supabase.js'
import { mlmConfigService } from './mlmConfig.service.js'

export const mlmFraudService = {
  async scanEvent(event) {
    const flags = []
    let riskScore = 0

    const selfRefRules = await mlmConfigService.getRule('fraud_self_referral', { enabled: true })
    if (
      selfRefRules.enabled &&
      event.sponsor_user_id &&
      event.sponsor_user_id === event.user_id
    ) {
      flags.push({ type: 'self_referral', score: 90 })
      riskScore = Math.max(riskScore, 90)
    }

    const rapidRules = await mlmConfigService.getRule('fraud_rapid_cycle', { max_events_per_hour: 15 })
    const hourAgo = new Date(Date.now() - 3600000).toISOString()
    const { count } = await supabase
      .from('mlm_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', event.user_id)
      .gte('created_at', hourAgo)

    if ((count || 0) > (rapidRules.max_events_per_hour || 15)) {
      flags.push({ type: 'rapid_cycling', score: 70, count })
      riskScore = Math.max(riskScore, 70)
    }

    if (event.event_type === 'package_purchased' && parseFloat(event.bv_amount) <= 0) {
      flags.push({ type: 'zero_bv_purchase', score: 40 })
      riskScore = Math.max(riskScore, 40)
    }

    const { data: sponsor } = event.sponsor_user_id
      ? await supabase.from('users').select('status').eq('id', event.sponsor_user_id).single()
      : { data: null }

    if (sponsor?.status === 'suspended') {
      flags.push({ type: 'sponsor_suspended', score: 60 })
      riskScore = Math.max(riskScore, 60)
    }

    for (const f of flags) {
      await supabase.from('fraud_flags').insert({
        user_id: event.user_id,
        flag_type: f.type,
        risk_score: f.score,
        event_id: event.id,
        details_json: f,
        status: f.score >= 80 ? 'reviewing' : 'open',
      })
    }

    return { riskScore, flags, blocked: riskScore >= 90 }
  },
}
