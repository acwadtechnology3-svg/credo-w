import { supabase } from '../../lib/supabase.js'
import { roundMoney } from '../../lib/money.js'
import { walletService } from '../wallet.service.js'
import { notifyUser } from '../../lib/notify.js'
import { emitToUser } from '../../lib/socket.js'

const COMMISSION_TYPES = {
  DIRECT: 'direct_bonus',
  BINARY: 'binary_bonus',
  MATCHING: 'matching_bonus',
  RANK: 'rank_bonus',
  FAST_START: 'fast_start_bonus',
  AGENCY: 'agency_bonus',
  LEADERSHIP: 'leadership_bonus',
}

export const mlmCommissionEngine = {
  async recordCalculation({
    eventId,
    userId,
    commissionType,
    baseAmount,
    ratePct,
    calculatedAmount,
    cappedAmount = null,
    periodKey = null,
    formulaKey = null,
    metadata = {},
    idempotencyKey = null,
    autoPay = false,
  }) {
    if (idempotencyKey) {
      const { data: dup } = await supabase
        .from('commission_calculations')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (dup) return { calculation: dup, duplicate: true }
    }

    const amount = roundMoney(cappedAmount ?? calculatedAmount)
    if (amount <= 0) return { calculation: null, skipped: true }

    const { data: calc, error } = await supabase
      .from('commission_calculations')
      .insert({
        event_id: eventId,
        user_id: userId,
        commission_type: commissionType,
        formula_key: formulaKey,
        base_amount: roundMoney(baseAmount),
        rate_pct: ratePct,
        calculated_amount: roundMoney(calculatedAmount),
        capped_amount: cappedAmount != null ? roundMoney(cappedAmount) : null,
        status: autoPay ? 'approved' : 'calculated',
        period_key: periodKey,
        metadata,
        idempotency_key: idempotencyKey,
      })
      .select()
      .single()

    if (error) throw error

    if (autoPay) {
      await this.createPayout(calc.id, userId, amount, { auto: true })
    }

    return { calculation: calc }
  },

  async createPayout(calculationId, userId, amount, { approvedBy = null, auto = false } = {}) {
    const { data: payout, error } = await supabase
      .from('commission_payouts')
      .insert({
        calculation_id: calculationId,
        user_id: userId,
        amount: roundMoney(amount),
        status: auto ? 'paid' : 'pending',
        approved_by: approvedBy,
        paid_at: auto ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) throw error

    if (auto) {
      const { data: calc } = await supabase
        .from('commission_calculations')
        .select('commission_type, event_id')
        .eq('id', calculationId)
        .single()

      const wtx = await walletService.credit(
        userId,
        'EARNINGS',
        amount,
        calc?.commission_type?.toUpperCase() || 'MLM_COMMISSION',
        `MLM ${calc?.commission_type}`,
        calculationId
      )

      await supabase
        .from('commission_payouts')
        .update({ wallet_tx_id: wtx?.id })
        .eq('id', payout.id)

      await supabase
        .from('commission_calculations')
        .update({ status: 'paid' })
        .eq('id', calculationId)

      emitToUser(userId, 'mlm:commission', {
        amount,
        type: calc?.commission_type,
        payoutId: payout.id,
      })
    }

    await supabase.from('payout_audit_logs').insert({
      payout_id: payout.id,
      actor_id: approvedBy,
      action: auto ? 'auto_paid' : 'created',
      after_json: payout,
    })

    return payout
  },

  async processDirectBonus(event, pkg, sponsorId) {
    if (!sponsorId || !(pkg.direct_commission_egp > 0)) return null
    return this.recordCalculation({
      eventId: event.id,
      userId: sponsorId,
      commissionType: COMMISSION_TYPES.DIRECT,
      baseAmount: pkg.bv_points || 0,
      ratePct: 0,
      calculatedAmount: roundMoney(pkg.direct_commission_egp),
      formulaKey: 'direct_bonus',
      idempotencyKey: `direct:${event.id}:${sponsorId}`,
      autoPay: true,
      metadata: { buyer_id: event.user_id, package: pkg.name },
    })
  },

  async processBinaryPreview(event, userId, matching) {
    return this.recordCalculation({
      eventId: event.id,
      userId,
      commissionType: COMMISSION_TYPES.BINARY,
      baseAmount: matching.matched,
      ratePct: matching.binaryPct,
      calculatedAmount: matching.estimatedPayout,
      periodKey: matching.periodKey,
      formulaKey: 'binary_match_pct',
      idempotencyKey: `binary-preview:${event.id}:${userId}:${matching.periodKey}`,
      autoPay: false,
      metadata: {
        left: matching.leftTotal,
        right: matching.rightTotal,
        note: 'Accrued — paid on weekly cycle',
      },
    })
  },

  COMMISSION_TYPES,
}
