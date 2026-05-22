import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { walletLedgerService } from './walletLedger.service.js'
import { rulesEngine } from './rulesEngine.service.js'

const WALLET_PRIORITY = ['CMONEY', 'PROMO', 'CASHBACK', 'EARNINGS']

export const hybridPaymentService = {
  /**
   * Smart split: prioritize wallets per business rules.
   */
  async calculateSplit(userId, totalAmount, preferredAllocations = null) {
    const total = roundMoney(totalAmount)
    if (total <= 0) {
      return { total, walletAmount: 0, externalAmount: 0, allocations: [], suggestions: [] }
    }

    const ecosystem = await walletLedgerService.getEcosystem(userId)
    const payable = ecosystem.filter(
      (w) => w.can_pay_packages && w.is_visible && WALLET_PRIORITY.includes(w.type)
    )

    payable.sort(
      (a, b) => WALLET_PRIORITY.indexOf(a.type) - WALLET_PRIORITY.indexOf(b.type)
    )

    let remaining = total
    const allocations = []
    const suggestions = []

    if (preferredAllocations?.length) {
      for (const pref of preferredAllocations) {
        const w = payable.find((x) => x.type === pref.wallet_type)
        if (!w) continue
        const use = roundMoney(Math.min(pref.amount || 0, w.available_balance, remaining))
        if (use > 0) {
          allocations.push({ wallet_type: w.type, amount: use })
          remaining = roundMoney(remaining - use)
        }
      }
    } else {
      for (const w of payable) {
        if (remaining <= 0) break
        const use = roundMoney(Math.min(w.available_balance, remaining))
        if (use > 0) {
          allocations.push({ wallet_type: w.type, amount: use })
          remaining = roundMoney(remaining - use)
          suggestions.push({
            wallet_type: w.type,
            suggested_amount: use,
            available: w.available_balance,
            message_ar: `استخدم ${use} ج.م من ${w.name_ar || w.type}`,
          })
        }
      }
    }

    const walletAmount = roundMoney(
      allocations.reduce((s, a) => s + a.amount, 0)
    )
    const externalAmount = roundMoney(total - walletAmount)

    return {
      total,
      walletAmount,
      externalAmount,
      allocations,
      suggestions,
      canPayFullyWithWallet: externalAmount === 0,
    }
  },

  async getActivePaymentMethods(region = 'EG') {
    const { data, error } = await supabase
      .from('payment_methods_config')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (error) throw error

    const externalEnabled = await rulesEngine.isFeatureEnabled('external_payments', { region })
    return (data || []).filter((m) => {
      if (m.method_type === 'internal_wallet' || m.code === 'cmoney') return true
      return externalEnabled && m.is_active !== false
    })
  },
}
