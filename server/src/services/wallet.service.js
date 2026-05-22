import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { emitToUser } from '../lib/socket.js'

export const walletService = {
  async createUserWallets(userId) {
    const defaultTypes = [
      'EARNINGS',
      'CMONEY',
      'PEARLS',
      'BONUS',
      'LOCKED',
      'PENDING',
      'PROMO',
      'CASHBACK',
      'RANK_REWARD',
    ]
    const { data: existing } = await supabase
      .from('wallets')
      .select('type')
      .eq('user_id', userId)
    const have = new Set((existing || []).map((w) => w.type))
    const missing = defaultTypes.filter((t) => !have.has(t))
    if (!missing.length) return
    const { error } = await supabase.from('wallets').insert(
      missing.map((type) => ({ user_id: userId, type, balance: 0 }))
    )
    if (error) throw error
  },

  async getWallet(userId, type) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .single()
    if (error) throw error
    return data
  },

  /**
   * Atomic debit via DB function when available; falls back to read-update.
   */
  async debit(userId, type, amount, category, description, refId = null, options = {}) {
    const delta = -Math.abs(roundMoney(amount))
    return this.applyDelta(userId, type, delta, category, description, refId, options)
  },

  async credit(userId, type, amount, category, description, refId = null, options = {}) {
    const delta = roundMoney(amount)
    return this.applyDelta(userId, type, delta, category, description, refId, options)
  },

  async applyDelta(userId, type, amount, category, description, refId = null, options = {}) {
    const delta = roundMoney(amount)
    if (delta === 0) {
      const err = new Error('Zero amount')
      err.code = 'ZERO_AMOUNT'
      throw err
    }

    const rpcParams = {
      p_user_id: userId,
      p_wallet_type: type,
      p_delta: delta,
      p_category: category,
      p_description: description,
      p_ref_id: refId,
    }
    if (options.idempotencyKey) rpcParams.p_idempotency_key = options.idempotencyKey
    if (options.refType) rpcParams.p_ref_type = options.refType

    const { data: rpcResult, error: rpcError } = await supabase.rpc('wallet_apply_delta', rpcParams)

    if (!rpcError && rpcResult) {
      const balanceAfter = rpcResult.balance_after ?? rpcResult.balanceAfter
      if (parseFloat(amount) > 0) {
        this.emitWalletUpdate(userId, type, amount, balanceAfter, category, description)
      }
      return balanceAfter
    }

    if (rpcError && !/wallet_apply_delta|42883|PGRST202/i.test(rpcError.message || '')) {
      if (rpcError.message?.includes('INSUFFICIENT_BALANCE')) {
        const err = new Error('Insufficient balance')
        err.code = 'INSUFFICIENT_BALANCE'
        throw err
      }
      if (rpcError.message?.includes('DUPLICATE_TRANSACTION')) {
        const err = new Error('Duplicate transaction')
        err.code = 'DUPLICATE_TRANSACTION'
        throw err
      }
    }

    return this.applyDeltaLegacy(userId, type, delta, category, description, refId)
  },

  async applyDeltaLegacy(userId, type, delta, category, description, refId) {
    if (refId && category === 'PURCHASE' && delta < 0) {
      const { data: existing } = await supabase
        .from('wallet_transactions')
        .select('id, balance_after')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('ref_id', refId)
        .maybeSingle()

      if (existing) {
        const err = new Error('Duplicate transaction')
        err.code = 'DUPLICATE_TRANSACTION'
        throw err
      }
    }

    const wallet = await this.getWallet(userId, type)
    const currentBalance = roundMoney(wallet.balance)
    const newBalance = roundMoney(currentBalance + delta)

    if (newBalance < 0) {
      const err = new Error('Insufficient balance')
      err.code = 'INSUFFICIENT_BALANCE'
      throw err
    }

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    if (updateError) throw updateError

    const { error: txError } = await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id: userId,
      category,
      amount: delta,
      balance_after: newBalance,
      description,
      ref_id: refId,
    })

    if (txError) {
      if (txError.code === '23505') {
        const err = new Error('Duplicate transaction')
        err.code = 'DUPLICATE_TRANSACTION'
        throw err
      }
      throw txError
    }

    if (delta > 0) {
      this.emitWalletUpdate(userId, type, delta, newBalance, category, description)
    }

    return newBalance
  },

  emitWalletUpdate(userId, type, amount, balanceAfter, category, description) {
    try {
      emitToUser(userId, 'wallet:updated', {
        type,
        amount: parseFloat(amount),
        balance_after: balanceAfter,
        category,
        description,
      })
    } catch {
      /* socket not critical */
    }
  },
}
