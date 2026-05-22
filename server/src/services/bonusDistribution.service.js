import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { walletService } from './wallet.service.js'

/**
 * Async-safe bonus crediting with ledger audit trail.
 */
export const bonusDistributionService = {
  async creditBonus({
    userId,
    amount,
    category,
    description,
    targetWallet = 'BONUS',
    refId = null,
    metadata = {},
  }) {
    const amt = roundMoney(amount)
    if (amt <= 0) return null

    const idempotencyKey = `bonus-${category}-${userId}-${refId || 'na'}-${amt}`

    try {
      const balanceAfter = await walletService.credit(
        userId,
        targetWallet,
        amt,
        category,
        description,
        refId,
        { idempotencyKey, refType: 'bonus_distribution' }
      )

      await supabase.from('finance_analytics_events').insert({
        event_type: 'bonus_credited',
        user_id: userId,
        amount: amt,
        payload_json: { category, targetWallet, ...metadata },
      })

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'BONUS',
        title: 'مكافأة جديدة',
        body: `${description} — EGP ${amt}`,
      })

      return { balanceAfter, amount: amt }
    } catch (err) {
      if (err.code === 'DUPLICATE_TRANSACTION') return { duplicate: true }
      throw err
    }
  },

  async distributeRankBonus(userId, rankName, amountEgp) {
    return this.creditBonus({
      userId,
      amount: amountEgp,
      category: 'RANK_BONUS',
      description: `Rank bonus — ${rankName}`,
      targetWallet: 'RANK_REWARD',
    })
  },

  async distributeReferralBonus(userId, amount, refereeId) {
    return this.creditBonus({
      userId,
      amount,
      category: 'REFERRAL_BONUS',
      description: 'Referral bonus',
      targetWallet: 'BONUS',
      refId: refereeId,
    })
  },

  async distributeCashback(userId, amount, orderId) {
    return this.creditBonus({
      userId,
      amount,
      category: 'CASHBACK',
      description: 'Order cashback',
      targetWallet: 'CASHBACK',
      refId: orderId,
    })
  },
}
