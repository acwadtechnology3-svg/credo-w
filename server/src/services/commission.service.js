import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { walletService } from './wallet.service.js'
import { notifyUser } from '../lib/notify.js'

export const commissionService = {
  async runWeeklyCycle() {
    const weekStart = getWeekStart()
    const weekEnd = getWeekEnd()

    const { data: existing } = await supabase
      .from('commission_cycles')
      .select('id, status')
      .eq('week_start', weekStart)
      .single()

    if (existing?.status === 'completed') {
      throw new Error('Commission already ran this week')
    }

    let cycleId
    if (existing) {
      cycleId = existing.id
      await supabase.from('commission_cycles').update({ status: 'running' }).eq('id', cycleId)
    } else {
      const { data: cycle } = await supabase
        .from('commission_cycles')
        .insert({ week_start: weekStart, week_end: weekEnd, status: 'running' })
        .select()
        .single()
      cycleId = cycle.id
    }

    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, rank_id, ranks(name, commission_pct, weekly_cap_egp, monthly_cap_egp, sort_order)')
        .eq('status', 'active')
        .not('rank_id', 'is', null)

      let totalPaid = 0
      let usersProcessed = 0

      for (const user of users || []) {
        try {
          const result = await this.processUserCommission(user, cycleId, weekStart)
          totalPaid += result.commissionAmount
          usersProcessed++
        } catch (err) {
          console.error(`Commission error for user ${user.id}:`, err.message)
        }
      }

      await supabase
        .from('commission_cycles')
        .update({
          status: 'completed',
          total_paid: totalPaid,
          users_processed: usersProcessed,
          ran_at: new Date(),
        })
        .eq('id', cycleId)

      return { cycleId, totalPaid, usersProcessed }
    } catch (err) {
      await supabase.from('commission_cycles').update({ status: 'failed' }).eq('id', cycleId)
      throw err
    }
  },

  async processUserCommission(user, cycleId, weekStart) {
    const { data: existing } = await supabase
      .from('team_commissions')
      .select('id')
      .eq('cycle_id', cycleId)
      .eq('user_id', user.id)
      .single()
    if (existing) return { commissionAmount: 0 }

    const { data: bvLogs } = await supabase
      .from('bv_logs')
      .select('side, amount')
      .eq('user_id', user.id)
      .gte('created_at', weekStart)

    const weekSideA = (bvLogs || [])
      .filter((b) => b.side === 'LEFT')
      .reduce((s, b) => s + parseFloat(b.amount), 0)
    const weekSideB = (bvLogs || [])
      .filter((b) => b.side === 'RIGHT')
      .reduce((s, b) => s + parseFloat(b.amount), 0)

    const { data: lastCycle } = await supabase
      .from('team_commissions')
      .select('left_carry, right_carry')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const leftTotal = weekSideA + parseFloat(lastCycle?.left_carry || 0)
    const rightTotal = weekSideB + parseFloat(lastCycle?.right_carry || 0)

    const payLegVolume = Math.min(leftTotal, rightTotal)

    if (payLegVolume <= 0) {
      await supabase.from('team_commissions').insert({
        cycle_id: cycleId,
        user_id: user.id,
        pay_leg_volume: 0,
        left_carry: leftTotal,
        right_carry: rightTotal,
        commission_pct: user.ranks?.commission_pct || 0,
        rank_at_time: user.ranks?.name || 'BAP',
        commission_amount: 0,
      })
      return { commissionAmount: 0 }
    }

    const commissionPct = parseFloat(user.ranks?.commission_pct || 0)
    let commissionAmount = payLegVolume * (commissionPct / 100)

    const weeklyCap = parseFloat(user.ranks?.weekly_cap_egp || 0)
    if (weeklyCap > 0 && commissionAmount > weeklyCap) {
      commissionAmount = weeklyCap
    }

    const rankMonthlyCap = parseFloat(user.ranks?.monthly_cap_egp || 0)
    if (rankMonthlyCap > 0 && commissionAmount > rankMonthlyCap) {
      commissionAmount = rankMonthlyCap
    }

    const { data: monthlySetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'monthly_commission_cap_egp')
      .single()
    const monthlyGlobalCap = parseFloat(monthlySetting?.value || 300000)

    const { data: userMonthly } = await supabase
      .from('users')
      .select('commission_earned_this_month, commission_earned_this_week')
      .eq('id', user.id)
      .single()
    const earnedThisMonth = parseFloat(userMonthly?.commission_earned_this_month || 0)
    const earnedThisWeek = parseFloat(userMonthly?.commission_earned_this_week || 0)

    if (earnedThisMonth + commissionAmount > monthlyGlobalCap) {
      commissionAmount = Math.max(0, monthlyGlobalCap - earnedThisMonth)
    }

    if (weeklyCap > 0 && earnedThisWeek + commissionAmount > weeklyCap) {
      commissionAmount = Math.max(0, weeklyCap - earnedThisWeek)
    }

    const leftCarry = leftTotal > rightTotal ? leftTotal - payLegVolume : 0
    const rightCarry = rightTotal > leftTotal ? rightTotal - payLegVolume : 0

    await supabase.from('team_commissions').insert({
      cycle_id: cycleId,
      user_id: user.id,
      pay_leg_volume: payLegVolume,
      left_carry: leftCarry,
      right_carry: rightCarry,
      commission_pct: commissionPct,
      rank_at_time: user.ranks?.name,
      commission_amount: Math.round(commissionAmount * 100) / 100,
    })

    const paidAmount = Math.round(commissionAmount * 100) / 100

    if (paidAmount > 0) {
      await walletService.credit(
        user.id,
        'EARNINGS',
        paidAmount,
        'TEAM_COMMISSION',
        `Weekly team commission — Week of ${weekStart}`
      )

      const { data: userTotals } = await supabase
        .from('users')
        .select('commission_paid_total')
        .eq('id', user.id)
        .single()

      await supabase
        .from('users')
        .update({
          commission_earned_this_month: roundMoney(earnedThisMonth + paidAmount),
          commission_earned_this_week: roundMoney(earnedThisWeek + paidAmount),
          commission_paid_total: roundMoney(
            parseFloat(userTotals?.commission_paid_total || 0) + paidAmount
          ),
        })
        .eq('id', user.id)

      await notifyUser(user.id, {
        type: 'COMMISSION_PAID',
        title: 'Team commission credited',
        body: `EGP ${paidAmount.toFixed(2)} added to your earnings wallet`,
      })
    }

    return { commissionAmount: paidAmount }
  },
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day
  const sunday = new Date(d.setDate(diff))
  return sunday.toISOString().split('T')[0]
}

function getWeekEnd() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + 6
  const saturday = new Date(d.setDate(diff))
  return saturday.toISOString().split('T')[0]
}
