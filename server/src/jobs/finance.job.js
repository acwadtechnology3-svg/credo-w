import cron from 'node-cron'
import { supabase } from '../lib/supabase.js'
import { PAYMENT_STATUS } from '../lib/paymentStateMachine.js'
import { walletLedgerService } from '../services/walletLedger.service.js'

export async function expireStalePaymentSessions() {
  const now = new Date().toISOString()

  const { data: stale } = await supabase
    .from('payment_sessions')
    .select('id, user_id, status')
    .lt('expires_at', now)
    .in('status', [
      PAYMENT_STATUS.INITIATED,
      PAYMENT_STATUS.WALLET_RESERVED,
      PAYMENT_STATUS.EXTERNAL_PENDING,
      PAYMENT_STATUS.UNDER_REVIEW,
    ])

  let count = 0
  for (const s of stale || []) {
    await walletLedgerService.releaseHolds(s.id, 'expired')
    await supabase
      .from('payment_sessions')
      .update({
        status: PAYMENT_STATUS.EXPIRED,
        failure_reason: 'session_expired',
        updated_at: now,
      })
      .eq('id', s.id)

    await supabase.from('payment_session_transitions').insert({
      payment_session_id: s.id,
      from_status: s.status,
      to_status: PAYMENT_STATUS.EXPIRED,
      reason: 'cron_expiry',
    })

    await supabase
      .from('payment_reviews')
      .update({ status: 'expired', updated_at: now })
      .eq('payment_session_id', s.id)
      .in('status', ['pending', 'needs_review'])

    count++
  }

  const { data: staleHolds } = await supabase
    .from('wallet_holds')
    .select('id, payment_session_id')
    .eq('status', 'active')
    .lt('expires_at', now)

  for (const h of staleHolds || []) {
    await supabase
      .from('wallet_holds')
      .update({ status: 'expired', released_at: now })
      .eq('id', h.id)
  }

  return { sessions: count, holds: (staleHolds || []).length }
}

export const startFinanceJob = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const result = await expireStalePaymentSessions()
      if (result.sessions > 0) {
        console.log(`Finance job: expired ${result.sessions} payment session(s)`)
      }
    } catch (err) {
      console.error('Finance expiry job failed:', err.message)
    }
  })
  console.log('Finance cron scheduled (payment session expiry every 10 min)')
}
