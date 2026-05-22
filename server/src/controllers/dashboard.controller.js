import { supabase } from '../lib/supabase.js'

export const dashboardController = {
  async getData(req, res) {
    try {
      const userId = req.user.userId

      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('*, ranks(*)')
        .eq('id', userId)
        .single()

      if (userErr || !user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const { data: bvLogs } = await supabase
        .from('bv_logs')
        .select('side, amount')
        .eq('user_id', userId)

      const sideA =
        bvLogs?.filter((b) => b.side === 'LEFT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0
      const sideB =
        bvLogs?.filter((b) => b.side === 'RIGHT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0

      const { data: nextRank } = await supabase
        .from('ranks')
        .select('*')
        .gt('sort_order', user.ranks?.sort_order || 0)
        .order('sort_order')
        .limit(1)
        .maybeSingle()

      const { data: directReferrals } = await supabase
        .from('users')
        .select('id, username, status, created_at, active_date, country')
        .eq('sponsor_id', userId)
        .order('created_at', { ascending: false })

      const { data: treeNodeUser } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      let placementChildren = []
      if (treeNodeUser) {
        const { data: children } = await supabase
          .from('tree_nodes')
          .select('side, users!inner(status)')
          .like('path', `%${treeNodeUser.id}%`)
          .neq('user_id', userId)
        placementChildren = children || []
      }

      const activeDirects = directReferrals?.filter((u) => u.status === 'active').length || 0

      const snapshot = {
        sideA: {
          active: placementChildren.filter((n) => n.side === 'LEFT' && n.users?.status === 'active')
            .length,
          inactive: placementChildren.filter(
            (n) => n.side === 'LEFT' && n.users?.status !== 'active'
          ).length,
          total: placementChildren.filter((n) => n.side === 'LEFT').length,
          direct: activeDirects,
          unsettledBv: sideA,
        },
        sideB: {
          active: placementChildren.filter((n) => n.side === 'RIGHT' && n.users?.status === 'active')
            .length,
          inactive: placementChildren.filter(
            (n) => n.side === 'RIGHT' && n.users?.status !== 'active'
          ).length,
          total: placementChildren.filter((n) => n.side === 'RIGHT').length,
          direct: activeDirects,
          unsettledBv: sideB,
        },
      }

      const recentAmbassadors = (directReferrals || []).slice(0, 5).map((u) => ({
        username: u.username,
        country: u.country,
        joining_date: u.created_at,
        activation_date: u.active_date,
        status: u.status,
      }))

      const referralLinks = {
        sideA: `/register?ref=${user.user_code}&side=LEFT`,
        sideB: `/register?ref=${user.user_code}&side=RIGHT`,
        auto: `/register?ref=${user.user_code}&side=AUTO`,
        customer: `/customer-register?ref=${user.user_code}`,
      }
      // sideA/sideB: franchise picks tree leg for balance; registrant cannot change side on the form

      const { data: wallets } = await supabase
        .from('wallets')
        .select('type, balance')
        .eq('user_id', userId)

      const earnings = wallets?.find((w) => w.type === 'EARNINGS')?.balance || 0
      const cmoney = wallets?.find((w) => w.type === 'CMONEY')?.balance || 0

      const directCount = directReferrals?.length || 0
      const fastStartBonusCycles = Math.floor(directCount / 3)

      const { data: monthlyData } = await supabase
        .from('users')
        .select('created_at')
        .eq('sponsor_id', userId)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

      const monthlyChart = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (11 - i))
        const month = d.toLocaleString('en', { month: 'short' })
        const count = (monthlyData || []).filter((u) => {
          const ud = new Date(u.created_at)
          return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear()
        }).length
        return { month, count }
      })

      return res.json({
        user: {
          id: user.id,
          user_code: user.user_code,
          username: user.username,
          full_name: user.full_name,
          rank: user.ranks,
          total_pv: user.total_pv,
          direct_count: user.direct_count ?? directCount,
        },
        bv: { sideA, sideB },
        nextRank: nextRank || null,
        snapshot,
        recentAmbassadors,
        referralLinks,
        wallets: { earnings, cmoney },
        fastStart: {
          directCount,
          directRequired: 3,
          bonusCycles: fastStartBonusCycles,
        },
        monthlyChart,
      })
    } catch (err) {
      console.error('Dashboard error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
