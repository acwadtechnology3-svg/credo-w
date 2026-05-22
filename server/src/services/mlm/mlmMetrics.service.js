import { supabase } from '../../lib/supabase.js'
import { roundMoney } from '../../lib/money.js'
import { bvService } from '../bv.service.js'

function monthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const mlmMetricsService = {
  async computeUserMetrics(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('total_pv, direct_count, membership_status, current_package_level')
      .eq('id', userId)
      .single()

    const bvTotals = await bvService.getUserBVTotals(userId)
    const pv = roundMoney(parseFloat(user?.total_pv || 0))
    const bvLeft = roundMoney(bvTotals.sideA)
    const bvRight = roundMoney(bvTotals.sideB)
    const bvMatching = roundMoney(bvTotals.weaker)
    const cvRatio = await import('./mlmConfig.service.js').then((m) =>
      m.mlmConfigService.getRule('cv_ratio', { cv_pct_of_bv: 100 })
    )
    const cvPct = (cvRatio.cv_pct_of_bv ?? 100) / 100
    const cv = roundMoney(bvMatching * cvPct)

    const { count: downlineCount } = await supabase
      .from('tree_nodes')
      .select('*', { count: 'exact', head: true })
      .like('path', `%`)

    const { data: myNode } = await supabase
      .from('tree_nodes')
      .select('id, path')
      .eq('user_id', userId)
      .maybeSingle()

    let gv = 0
    let tv = 0
    if (myNode) {
      const { data: downlineNodes } = await supabase
        .from('tree_nodes')
        .select('user_id')
        .like('path', `%${myNode.id}%`)
        .neq('user_id', userId)
        .limit(500)

      for (const n of downlineNodes || []) {
        const t = await bvService.getUserBVTotals(n.user_id)
        gv += t.sideA + t.sideB
      }
      tv = gv + bvLeft + bvRight
    }

    const { count: activeDirects } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('sponsor_id', userId)
      .eq('status', 'active')
      .eq('membership_status', 'active')

    return {
      pv,
      bv_personal: pv,
      bv_left: bvLeft,
      bv_right: bvRight,
      bv_matching: bvMatching,
      cv,
      gv: roundMoney(gv),
      tv: roundMoney(tv),
      direct_count: user?.direct_count || 0,
      active_direct_count: activeDirects || 0,
      package_level: user?.current_package_level || 0,
    }
  },

  async snapshotUser(userId, eventId = null, periodKey = 'lifetime') {
    const metrics = await this.computeUserMetrics(userId)
    const { data, error } = await supabase
      .from('user_metric_snapshots')
      .upsert(
        {
          user_id: userId,
          event_id: eventId,
          period_key: periodKey,
          ...metrics,
          snapshot_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,period_key' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async snapshotAgency(agencyId, eventId = null) {
    if (!agencyId) return null

    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', agencyId)
      .eq('status', 'active')

    let agencyBv = 0
    let agencyCv = 0
    let active = 0
    for (const m of members || []) {
      const met = await this.computeUserMetrics(m.user_id)
      agencyBv += met.bv_left + met.bv_right
      agencyCv += met.cv
      if (met.package_level > 0) active++
    }

    const row = {
      agency_id: agencyId,
      period_key: 'lifetime',
      agency_bv: roundMoney(agencyBv),
      agency_cv: roundMoney(agencyCv),
      agency_gv: roundMoney(agencyBv),
      member_count: (members || []).length,
      active_count: active,
      activity_score: Math.min(100, active * 5),
      snapshot_at: new Date().toISOString(),
    }

    await supabase.from('agency_metric_snapshots').upsert(row, { onConflict: 'agency_id,period_key' })
    return row
  },
}
