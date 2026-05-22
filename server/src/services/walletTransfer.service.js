import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { walletService } from './wallet.service.js'
import { walletLedgerService } from './walletLedger.service.js'
import { fraudDetectionService } from './fraudDetection.service.js'

const TRANSFER_RULES = {
  CMONEY: { to: ['CMONEY'], dailyLimit: 50000 },
  EARNINGS: { to: [], dailyLimit: 0 },
  PROMO: { to: ['CMONEY'], dailyLimit: 10000 },
  CASHBACK: { to: ['CMONEY'], dailyLimit: 10000 },
}

export const walletTransferService = {
  async transferBetweenUsers({
    senderId,
    receiverId,
    fromWalletType,
    toWalletType = 'CMONEY',
    amount,
    note,
  }) {
    if (senderId === receiverId) {
      throw Object.assign(new Error('لا يمكن التحويل لنفسك'), { status: 400 })
    }

    const rules = TRANSFER_RULES[fromWalletType]
    if (!rules?.to?.includes(toWalletType)) {
      throw Object.assign(new Error('نوع المحفظة غير مسموح للتحويل'), { status: 400 })
    }

    const amt = roundMoney(amount)
    if (amt <= 0) throw Object.assign(new Error('المبلغ غير صالح'), { status: 400 })

    const velocity = await fraudDetectionService.checkVelocity(senderId)
    if (velocity.score >= 50) {
      throw Object.assign(new Error('تم تعليق التحويل — راجع الدعم'), { status: 403 })
    }

    const since = new Date(Date.now() - 86400000).toISOString()
    const { data: todayTx } = await supabase
      .from('wallet_transfers')
      .select('amount')
      .eq('sender_id', senderId)
      .gte('created_at', since)

    const dailyTotal = (todayTx || []).reduce((s, t) => s + parseFloat(t.amount), 0)
    if (dailyTotal + amt > rules.dailyLimit) {
      throw Object.assign(new Error('تجاوزت حد التحويل اليومي'), { status: 400 })
    }

    const available = await walletLedgerService.getAvailableBalance(senderId, fromWalletType)
    if (amt > available) {
      throw Object.assign(new Error('رصيد غير كافٍ'), { status: 400, code: 'INSUFFICIENT_BALANCE' })
    }

    const transferKey = `xfer-${senderId}-${receiverId}-${Date.now()}`

    await walletService.debit(
      senderId,
      fromWalletType,
      amt,
      'TRANSFER_OUT',
      note || `Transfer to user`,
      receiverId,
      { idempotencyKey: `${transferKey}-out`, refType: 'wallet_transfer' }
    )

    await walletService.credit(
      receiverId,
      toWalletType,
      amt,
      'TRANSFER_IN',
      note || `Transfer from user`,
      senderId,
      { idempotencyKey: `${transferKey}-in`, refType: 'wallet_transfer' }
    )

    const { data: row } = await supabase
      .from('wallet_transfers')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        from_wallet_type: fromWalletType,
        to_wallet_type: toWalletType,
        amount: amt,
        status: 'completed',
        note,
      })
      .select()
      .single()

    await supabase.from('notifications').insert({
      user_id: receiverId,
      type: 'WALLET_CREDIT',
      title: 'تحويل وارد',
      body: `EGP ${amt} — ${note || ''}`,
    })

    return row
  },

  async adminGrant({ userId, walletType, amount, reason, adminId }) {
    const amt = roundMoney(amount)
    await walletService.credit(userId, walletType, amt, 'ADMIN_GRANT', reason, null, {
      refType: 'admin_grant',
      idempotencyKey: `grant-${adminId}-${userId}-${Date.now()}`,
    })
    return { userId, walletType, amount: amt }
  },
}
