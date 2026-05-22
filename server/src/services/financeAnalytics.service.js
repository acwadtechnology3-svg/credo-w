import { supabase } from '../lib/supabase.js'

export const financeAnalyticsService = {
  async getDashboard() {
    const now = new Date().toISOString()
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [
      { count: pendingReviews },
      { count: pendingWithdrawals },
      { data: sessions },
      { data: ledger },
      { data: purchases },
    ] = await Promise.all([
      supabase
        .from('payment_reviews')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'needs_review', 'fraud_suspected']),
      supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .in('status', ['requested', 'pending', 'processing']),
      supabase
        .from('payment_sessions')
        .select('status, total_amount, wallet_amount, external_amount')
        .gte('created_at', weekAgo),
      supabase
        .from('wallet_ledger_entries')
        .select('entry_type, amount, wallet_type')
        .gte('created_at', weekAgo)
        .limit(5000),
      supabase
        .from('purchase_transactions')
        .select('amount_total, status')
        .eq('status', 'completed')
        .gte('created_at', weekAgo),
    ])

    const sessionStats = (sessions || []).reduce(
      (acc, s) => {
        acc.total += parseFloat(s.total_amount || 0)
        acc.byStatus[s.status] = (acc.byStatus[s.status] || 0) + 1
        return acc
      },
      { total: 0, byStatus: {} }
    )

    const revenue = (purchases || []).reduce((s, p) => s + parseFloat(p.amount_total || 0), 0)
    const walletCirculation = (ledger || []).reduce((s, e) => s + Math.abs(parseFloat(e.amount || 0)), 0)

    const { count: openFraudSignals } = await supabase
      .from('fraud_signals')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)

    return {
      pendingReviews: pendingReviews ?? 0,
      pendingWithdrawals: pendingWithdrawals ?? 0,
      weeklyRevenue: revenue,
      walletCirculation7d: walletCirculation,
      paymentSessions7d: sessionStats,
      openFraudSignals: openFraudSignals ?? 0,
      generatedAt: now,
    }
  },

  async getTopSpenders(limit = 10) {
    const { data } = await supabase
      .from('purchase_transactions')
      .select('user_id, amount_total, users(username, full_name)')
      .eq('status', 'completed')
      .order('amount_total', { ascending: false })
      .limit(limit)

    return data || []
  },
}
