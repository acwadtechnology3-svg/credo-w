import { supabase } from '../../lib/supabase.js'
import { mlmMetricsService } from './mlmMetrics.service.js'
import { mlmMatchingService } from './mlmMatching.service.js'

export const mlmAnalyticsService = {
  async getUserDashboard(userId) {
    const [metrics, matching, snapshots, recentEvents, commissions] = await Promise.all([
      mlmMetricsService.computeUserMetrics(userId),
      mlmMatchingService.computeMatching(userId),
      supabase
        .from('user_metric_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_at', { ascending: false })
        .limit(5),
      supabase
        .from('mlm_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('commission_calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const { data: carry } = await supabase
      .from('carry_forward_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const totalPending = (commissions.data || [])
      .filter((c) => ['calculated', 'approved'].includes(c.status))
      .reduce((s, c) => s + parseFloat(c.capped_amount ?? c.calculated_amount), 0)

    const totalPaid = (commissions.data || [])
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + parseFloat(c.capped_amount ?? c.calculated_amount), 0)

    return {
      metrics,
      matching,
      carry: carry || null,
      snapshots: snapshots.data || [],
      recentEvents: recentEvents.data || [],
      commissions: commissions.data || [],
      summary: {
        totalPending,
        totalPaid,
        balanceRatio:
          metrics.bv_left + metrics.bv_right > 0
            ? Math.round((Math.min(metrics.bv_left, metrics.bv_right) / Math.max(metrics.bv_left, metrics.bv_right)) * 100)
            : 0,
      },
    }
  },

  async getPlatformOverview() {
    const { count: eventCount } = await supabase
      .from('mlm_events')
      .select('*', { count: 'exact', head: true })

    const { count: pendingJobs } = await supabase
      .from('mlm_job_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: openFraud } = await supabase
      .from('fraud_flags')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'reviewing'])

    const { data: recentPayouts } = await supabase
      .from('commission_payouts')
      .select('amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    const paidTotal = (recentPayouts || [])
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + parseFloat(p.amount), 0)

    return {
      totalEvents: eventCount || 0,
      pendingJobs: pendingJobs || 0,
      openFraudFlags: openFraud || 0,
      recentPayoutVolume: paidTotal,
    }
  },
}
