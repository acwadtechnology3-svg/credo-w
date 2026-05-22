import { supabase } from '../../lib/supabase.js'
import { roundMoney } from '../../lib/money.js'
import { mlmConfigService } from './mlmConfig.service.js'

function weekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export const mlmMatchingService = {
  async computeMatching(userId, eventId = null) {
    const carryRules = await mlmConfigService.getRule('carry_forward', { enabled: true, period: 'weekly' })
    const binaryPct = await mlmConfigService.getRule('binary_match_pct', { default_pct: 10 })
    const pk = weekKey()

    const weekStart = getWeekStartDate()

    const { data: bvLogs } = await supabase
      .from('bv_logs')
      .select('side, amount')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())

    const weekLeft = (bvLogs || [])
      .filter((b) => b.side === 'LEFT')
      .reduce((s, b) => s + parseFloat(b.amount), 0)
    const weekRight = (bvLogs || [])
      .filter((b) => b.side === 'RIGHT')
      .reduce((s, b) => s + parseFloat(b.amount), 0)

    const { data: lastCarry } = await supabase
      .from('carry_forward_logs')
      .select('left_carry, right_carry')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const leftTotal = roundMoney(weekLeft + parseFloat(lastCarry?.left_carry || 0))
    const rightTotal = roundMoney(weekRight + parseFloat(lastCarry?.right_carry || 0))
    const matched = roundMoney(Math.min(leftTotal, rightTotal))
    const weakLeg = leftTotal <= rightTotal ? 'LEFT' : 'RIGHT'

    const newLeftCarry = roundMoney(leftTotal - matched)
    const newRightCarry = roundMoney(rightTotal - matched)

    if (carryRules.enabled) {
      await supabase.from('carry_forward_logs').insert({
        user_id: userId,
        event_id: eventId,
        period_key: pk,
        left_carry: newLeftCarry,
        right_carry: newRightCarry,
        left_matched: roundMoney(Math.min(leftTotal, matched)),
        right_matched: roundMoney(Math.min(rightTotal, matched)),
        weak_leg: weakLeg,
      })
    }

    const overflowPolicy = await mlmConfigService.getRule('overflow_policy', {})
    const imbalance = Math.max(leftTotal, rightTotal) / Math.max(1, Math.min(leftTotal, rightTotal))
    if (overflowPolicy.max_imbalance_ratio && imbalance > overflowPolicy.max_imbalance_ratio) {
      const excessSide = leftTotal > rightTotal ? 'LEFT' : 'RIGHT'
      const excess = roundMoney(Math.max(leftTotal, rightTotal) - matched * 2)
      if (excess > 0) {
        await supabase.from('overflow_logs').insert({
          user_id: userId,
          event_id: eventId,
          side: excessSide,
          overflow_amount: excess,
          reason: 'imbalance_cap',
        })
      }
    }

    const commissionVolume = matched
    const estimatedPayout = roundMoney(commissionVolume * ((binaryPct.default_pct || 10) / 100))

    return {
      periodKey: pk,
      leftTotal,
      rightTotal,
      matched,
      weakLeg,
      newLeftCarry,
      newRightCarry,
      estimatedPayout,
      binaryPct: binaryPct.default_pct || 10,
    }
  },
}

function getWeekStartDate() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const start = new Date(now)
  start.setDate(now.getDate() - diff)
  start.setHours(0, 0, 0, 0)
  return start
}
