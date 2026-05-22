import { supabase } from '../../lib/supabase.js'
import { roundMoney } from '../../lib/money.js'
import { mlmEventService } from './mlmEvent.service.js'
import { treeActivationService } from '../treeActivation.service.js'

export const mlmReversalService = {
  async reversePackagePurchase({ orderId, userId, reason = 'refund' }) {
    const { data: original } = await supabase
      .from('mlm_events')
      .select('*')
      .eq('order_id', orderId)
      .eq('event_type', 'package_purchased')
      .maybeSingle()

    if (!original) {
      throw Object.assign(new Error('Original purchase event not found'), { status: 404 })
    }

    if (original.processing_status === 'reversed') {
      return { alreadyReversed: true }
    }

    const { event: reversalEvent } = await mlmEventService.createEvent({
      eventType: 'package_reversed',
      userId: userId || original.user_id,
      orderId,
      bvAmount: -Math.abs(parseFloat(original.bv_amount)),
      idempotencyKey: `mlm:reverse:${orderId}`,
      metadata: { reason, original_event_id: original.id },
    })

    const bv = roundMoney(Math.abs(parseFloat(original.bv_amount)))

    const { data: logs } = await supabase
      .from('bv_propagation_logs')
      .select('*')
      .eq('event_id', original.id)

    for (const log of logs || []) {
      await supabase.from('bv_logs').insert({
        user_id: log.beneficiary_user_id,
        side: log.side,
        amount: -bv,
        source_user_id: log.source_user_id,
        order_id: orderId,
        note: `Reversal: ${reason}`,
      })
    }

    if (bv > 0) {
      await supabase.from('bv_logs').insert({
        user_id: original.user_id,
        side: 'LEFT',
        amount: -bv,
        source_user_id: original.user_id,
        order_id: orderId,
        note: `Personal reversal: ${reason}`,
      })
    }

    const { data: calcs } = await supabase
      .from('commission_calculations')
      .select('id, user_id, calculated_amount, capped_amount, status')
      .eq('event_id', original.id)
      .neq('status', 'reversed')

    for (const c of calcs || []) {
      const amt = parseFloat(c.capped_amount ?? c.calculated_amount)
      await supabase.from('commission_calculations').update({ status: 'reversed' }).eq('id', c.id)

      const { data: payouts } = await supabase
        .from('commission_payouts')
        .select('*')
        .eq('calculation_id', c.id)
        .eq('status', 'paid')

      for (const p of payouts || []) {
        const { walletService } = await import('../wallet.service.js')
        await walletService.applyDelta(
          p.user_id,
          'EARNINGS',
          -roundMoney(p.amount),
          'COMMISSION_REVERSAL',
          `Reversal order ${orderId}`,
          orderId
        )
        await supabase
          .from('commission_payouts')
          .update({ status: 'reversed', reversed_at: new Date().toISOString() })
          .eq('id', p.id)
      }
    }

    await mlmEventService.markStatus(original.id, 'reversed')
    await mlmEventService.markStatus(reversalEvent.id, 'completed')

    try {
      await treeActivationService.suspendOnPaymentReversal(userId || original.user_id)
    } catch {
      /* optional */
    }

    const { mlmMetricsService } = await import('./mlmMetrics.service.js')
    await mlmMetricsService.snapshotUser(original.user_id, reversalEvent.id)

    return { reversalEvent, originalEvent: original }
  },
}
