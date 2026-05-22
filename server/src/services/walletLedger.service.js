import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'

const PAYABLE_WALLET_TYPES = new Set(['CMONEY', 'PROMO', 'CASHBACK'])

export const walletLedgerService = {
  async getAvailableBalance(userId, walletType) {
    const wallet = await this.getWalletRow(userId, walletType)
    const balance = roundMoney(wallet.balance)

    const { data: holds } = await supabase
      .from('wallet_holds')
      .select('amount')
      .eq('user_id', userId)
      .eq('wallet_type', walletType)
      .eq('status', 'active')

    const held = (holds || []).reduce((s, h) => s + parseFloat(h.amount), 0)
    return roundMoney(Math.max(0, balance - held))
  },

  async getWalletRow(userId, walletType) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('type', walletType)
      .single()
    if (error) throw error
    return data
  },

  async ensureExtendedWallets(userId) {
    const types = ['BONUS', 'LOCKED', 'PENDING', 'PROMO', 'CASHBACK', 'RANK_REWARD']
    const { data: existing } = await supabase
      .from('wallets')
      .select('type')
      .eq('user_id', userId)

    const have = new Set((existing || []).map((w) => w.type))
    const missing = types.filter((t) => !have.has(t))
    if (!missing.length) return

    await supabase.from('wallets').insert(
      missing.map((type) => ({ user_id: userId, type, balance: 0 }))
    )
  },

  async getEcosystem(userId) {
    await this.ensureExtendedWallets(userId)

    const [{ data: wallets }, { data: defs }] = await Promise.all([
      supabase.from('wallets').select('id, type, balance, updated_at').eq('user_id', userId),
      supabase.from('wallet_type_definitions').select('*').order('sort_order'),
    ])

    const defMap = Object.fromEntries((defs || []).map((d) => [d.type_key, d]))
    const enriched = []

    for (const w of wallets || []) {
      const def = defMap[w.type] || {}
      const available = PAYABLE_WALLET_TYPES.has(w.type)
        ? await this.getAvailableBalance(userId, w.type)
        : roundMoney(w.balance)

      enriched.push({
        ...w,
        balance: roundMoney(w.balance),
        available_balance: available,
        name_en: def.name_en || w.type,
        name_ar: def.name_ar,
        can_withdraw: def.can_withdraw ?? false,
        can_transfer: def.can_transfer ?? false,
        can_pay_packages: def.can_pay_packages ?? false,
        is_visible: def.is_visible !== false,
      })
    }

    enriched.sort((a, b) => {
      const oa = defMap[a.type]?.sort_order ?? 99
      const ob = defMap[b.type]?.sort_order ?? 99
      return oa - ob
    })

    return enriched
  },

  async getLedger(userId, { limit = 50, walletType = null } = {}) {
    let q = supabase
      .from('wallet_ledger_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 200))

    if (walletType) q = q.eq('wallet_type', walletType)

    const { data, error } = await q
    if (error) {
      if (/wallet_ledger_entries|42P01/i.test(error.message || '')) return []
      throw error
    }
    return data || []
  },

  async createHold({ userId, walletType, amount, paymentSessionId, expiresAt }) {
    const wallet = await this.getWalletRow(userId, walletType)
    const available = await this.getAvailableBalance(userId, walletType)
    const amt = roundMoney(amount)

    if (amt > available) {
      const err = new Error('Insufficient available balance')
      err.code = 'INSUFFICIENT_BALANCE'
      throw err
    }

    const { data, error } = await supabase
      .from('wallet_holds')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        wallet_type: walletType,
        amount: amt,
        payment_session_id: paymentSessionId,
        status: 'active',
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async releaseHolds(paymentSessionId, status = 'released') {
    await supabase
      .from('wallet_holds')
      .update({ status, released_at: new Date().toISOString() })
      .eq('payment_session_id', paymentSessionId)
      .eq('status', 'active')
  },

  async consumeHolds(paymentSessionId) {
    return this.releaseHolds(paymentSessionId, 'consumed')
  },
}
