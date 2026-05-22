import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { bonusDistributionService } from './bonusDistribution.service.js'
import { bvService } from './bv.service.js'
import { emitToUser } from '../lib/socket.js'

function periodKey(freq, date = new Date()) {
  const d = date
  if (freq === 'daily') return d.toISOString().slice(0, 10)
  if (freq === 'weekly') {
    const start = new Date(d)
    start.setDate(d.getDate() - d.getDay())
    return `w-${start.toISOString().slice(0, 10)}`
  }
  if (freq === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  return 'lifetime'
}

export const bonusEngine = {
  async listBonuses() {
    const { data } = await supabase
      .from('bonuses')
      .select('*, bonus_rules(*)')
      .eq('is_active', true)
      .order('sort_order')
    return data || []
  },

  async processBinaryMatching(userId, { forcePeriod = null } = {}) {
    const { data: bonus } = await supabase
      .from('bonuses')
      .select('*, bonus_rules(*)')
      .eq('bonus_key', 'binary_matching')
      .eq('is_active', true)
      .maybeSingle()

    if (!bonus) return null

    const rule = bonus.bonus_rules?.find((r) => r.is_active) || bonus.bonus_rules?.[0]
    const cfg = rule?.value_json || {}
    const weakPct = (cfg.weak_leg_pct ?? bonus.default_pct ?? 8) / 100
    const minPair = cfg.min_pair_bv ?? 100

    const totals = await bvService.getUserBVTotals(userId)
    const weak = totals.weaker
    const pairs = Math.floor(weak / minPair)
    if (pairs <= 0) return null

    const amount = roundMoney(pairs * minPair * weakPct)
    const cap = rule?.cap_egp ?? bonus.default_cap_egp
    const finalAmt = cap ? Math.min(amount, cap) : amount
    if (finalAmt <= 0) return null

    const freq = bonus.payout_frequency || 'weekly'
    const pk = forcePeriod || periodKey(freq)
    const idempotencyKey = `binary-${userId}-${pk}`

    const { data: existing } = await supabase
      .from('bonus_transactions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existing) return { duplicate: true }

    await bonusDistributionService.creditBonus({
      userId,
      amount: finalAmt,
      category: 'BINARY_MATCHING',
      description: `Binary matching — ${pairs} pair(s)`,
      targetWallet: bonus.payout_wallet || 'BONUS',
      refId: null,
      metadata: { pairs, weak, period: pk },
    })

    await supabase.from('bonus_transactions').insert({
      user_id: userId,
      bonus_id: bonus.id,
      bonus_key: bonus.bonus_key,
      amount_egp: finalAmt,
      wallet_type: bonus.payout_wallet,
      period_key: pk,
      idempotency_key: idempotencyKey,
      calculation_json: { pairs, weak, weakPct, minPair },
    })

    emitToUser(userId, 'progression:celebration', {
      type: 'bonus_received',
      bonusKey: 'binary_matching',
      amount: finalAmt,
    })

    return { amount: finalAmt, pairs }
  },

  async processDirectBonus(userId, refereeId, baseAmount) {
    const { data: bonus } = await supabase
      .from('bonuses')
      .select('*, bonus_rules(*)')
      .eq('bonus_key', 'direct_bonus')
      .eq('is_active', true)
      .maybeSingle()

    if (!bonus) return null
    const pct = (bonus.default_pct || 10) / 100
    const amount = roundMoney(baseAmount * pct)
    if (amount <= 0) return null

    const pk = periodKey('instant')
    const idempotencyKey = `direct-${userId}-${refereeId}-${pk}`

    const { data: existing } = await supabase
      .from('bonus_transactions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existing) return { duplicate: true }

    await bonusDistributionService.distributeReferralBonus(userId, amount, refereeId)

    await supabase.from('bonus_transactions').insert({
      user_id: userId,
      bonus_id: bonus.id,
      bonus_key: bonus.bonus_key,
      amount_egp: amount,
      wallet_type: bonus.payout_wallet,
      period_key: pk,
      idempotency_key: idempotencyKey,
      reference_id: refereeId,
      calculation_json: { baseAmount, pct },
    })

    return { amount }
  },

  async getUserBonusHistory(userId, limit = 30) {
    const { data } = await supabase
      .from('bonus_transactions')
      .select('*, bonuses(name, bonus_type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  },

  async runPeriodicBonuses(period = 'weekly') {
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('status', 'active')
      .limit(500)

    let processed = 0
    for (const u of users || []) {
      try {
        await this.processBinaryMatching(u.id, { forcePeriod: periodKey(period) })
        processed++
      } catch (e) {
        console.warn(`Binary bonus ${u.id}:`, e.message)
      }
    }
    return { processed }
  },

  async simulatePayout(bonusKey, sampleMetrics) {
    const { data: bonus } = await supabase
      .from('bonuses')
      .select('*, bonus_rules(*)')
      .eq('bonus_key', bonusKey)
      .single()

    if (!bonus) return { error: 'Bonus not found' }

    const rule = bonus.bonus_rules?.[0]
    const cfg = rule?.value_json || {}
    let estimate = 0

    if (bonusKey === 'binary_matching') {
      const weak = sampleMetrics.weak_leg || sampleMetrics.bv_matching || 0
      const minPair = cfg.min_pair_bv ?? 100
      const pairs = Math.floor(weak / minPair)
      estimate = roundMoney(pairs * minPair * ((cfg.weak_leg_pct ?? 8) / 100))
    } else {
      estimate = roundMoney((sampleMetrics.base_amount || 0) * ((bonus.default_pct || 0) / 100))
    }

    return { bonus, rule, estimate, sampleMetrics }
  },
}
