import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { walletService } from './wallet.service.js'
import { paymentSessionService } from './paymentSession.service.js'
import { PAYMENT_STATUS } from '../lib/paymentStateMachine.js'
import { purchaseRecoveryService } from './purchaseRecovery.service.js'

export const refundEngine = {
  async createRefund({
    userId,
    paymentSessionId = null,
    purchaseTransactionId = null,
    amount,
    refundType = 'full',
    reason,
    processedBy,
  }) {
    const amt = roundMoney(amount)

    const { data: refund, error } = await supabase
      .from('financial_refunds')
      .insert({
        user_id: userId,
        payment_session_id: paymentSessionId,
        purchase_transaction_id: purchaseTransactionId,
        amount: amt,
        refund_type: refundType,
        status: 'pending',
        reason,
        processed_by: processedBy,
      })
      .select()
      .single()

    if (error) throw error
    return refund
  },

  async processRefund(refundId, adminId) {
    const { data: refund } = await supabase
      .from('financial_refunds')
      .select('*')
      .eq('id', refundId)
      .single()

    if (!refund || refund.status !== 'pending') {
      throw Object.assign(new Error('Refund not pending'), { status: 400 })
    }

    await walletService.credit(
      refund.user_id,
      'CMONEY',
      refund.amount,
      'REFUND',
      refund.reason || 'Refund',
      refund.id
    )

    if (refund.purchase_transaction_id) {
      try {
        const { data: purchase } = await supabase
          .from('purchase_transactions')
          .select('amount_wallet, user_id')
          .eq('id', refund.purchase_transaction_id)
          .single()
        if (purchase?.amount_wallet > 0) {
          await purchaseRecoveryService.compensateWallet(
            purchase.user_id,
            purchase.amount_wallet,
            refund.purchase_transaction_id,
            refund.reason || 'Refund'
          )
        }
      } catch (e) {
        console.warn('[refund] purchase reversal:', e.message)
      }
    }

    if (refund.payment_session_id) {
      await paymentSessionService.transition(refund.payment_session_id, PAYMENT_STATUS.REFUNDED, {
        actorId: adminId,
        reason: refund.reason,
      })
    }

    await supabase
      .from('financial_refunds')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_by: adminId,
      })
      .eq('id', refundId)

    await supabase.from('notifications').insert({
      user_id: refund.user_id,
      type: 'REFUND_ISSUED',
      title: 'تم إصدار استرداد',
      body: `EGP ${refund.amount} — ${refund.reason || ''}`,
    })

    return refund
  },
}
