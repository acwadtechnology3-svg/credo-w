import { supabase } from '../lib/supabase.js'

function isInNetwork(targetPath, myNodeId) {
  if (!targetPath || !myNodeId) return false
  return targetPath === myNodeId || targetPath.includes(myNodeId)
}

export const franchiseController = {
  async getOverview(req, res) {
    try {
      const userId = req.user.userId

      const { data: myNode } = await supabase
        .from('tree_nodes')
        .select('id, path')
        .eq('user_id', userId)
        .maybeSingle()

      if (!myNode) {
        return res.json({
          networkSize: 0,
          activeCount: 0,
          pendingCount: 0,
          networkBV: { sideA: 0, sideB: 0 },
          license: null,
          totalCommission: 0,
        })
      }

      const pathFilter = `path.like.%${myNode.id}%,path.eq.${myNode.id}`
      const { data: allNodes, count } = await supabase
        .from('tree_nodes')
        .select('user_id, users!inner(status)', { count: 'exact' })
        .or(pathFilter)

      const activeCount = (allNodes || []).filter((n) => n.users?.status === 'active').length
      const pendingCount = (allNodes || []).filter((n) => n.users?.status === 'pending').length

      const downlineIds = (allNodes || []).map((n) => n.user_id)
      let networkBV = { sideA: 0, sideB: 0 }

      if (downlineIds.length > 0) {
        const { data: bvData } = await supabase
          .from('bv_logs')
          .select('side, amount')
          .in('user_id', downlineIds)

        networkBV.sideA = (bvData || [])
          .filter((b) => b.side === 'LEFT')
          .reduce((s, b) => s + parseFloat(b.amount), 0)
        networkBV.sideB = (bvData || [])
          .filter((b) => b.side === 'RIGHT')
          .reduce((s, b) => s + parseFloat(b.amount), 0)
      }

      const { data: license } = await supabase
        .from('user_subscriptions')
        .select('*, subscriptions(name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: franchiseComm } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', 'TEAM_COMMISSION')

      const totalCommission = (franchiseComm || []).reduce(
        (s, t) => s + parseFloat(t.amount),
        0
      )

      return res.json({
        networkSize: count || 0,
        activeCount,
        pendingCount,
        networkBV,
        license: license || null,
        totalCommission: Math.round(totalCommission),
      })
    } catch (err) {
      console.error('getOverview error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getNetworkAmbassadors(req, res) {
    try {
      const { page = 1, limit = 50, status, search } = req.query
      const offset = (page - 1) * limit
      const userId = req.user.userId

      const { data: myNode } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!myNode) return res.json({ data: [], total: 0 })

      const pathFilter = `path.like.%${myNode.id}%,path.eq.${myNode.id}`
      let query = supabase
        .from('tree_nodes')
        .select(
          'side, depth_level, users!inner(id, username, full_name, email, status, country, created_at, active_date, ranks(name))',
          { count: 'exact' }
        )
        .or(pathFilter)
        .neq('user_id', userId)
        .order('depth_level')
        .range(offset, offset + parseInt(limit) - 1)

      if (status) query = query.eq('users.status', status)

      const { data, count, error } = await query
      if (error) throw error

      let result = (data || []).map((n) => ({
        username: n.users?.username,
        full_name: n.users?.full_name,
        email: n.users?.email,
        status: n.users?.status,
        country: n.users?.country,
        rank: n.users?.ranks?.name || 'BAP',
        side: n.side,
        depth: n.depth_level,
        joined: n.users?.created_at,
        activated: n.users?.active_date,
        user_id: n.users?.id,
      }))

      if (search) {
        const q = search.toLowerCase()
        result = result.filter(
          (r) =>
            r.username?.toLowerCase().includes(q) ||
            r.full_name?.toLowerCase().includes(q)
        )
      }

      return res.json({ data: result, total: count })
    } catch (err) {
      console.error('getNetworkAmbassadors error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async activateAmbassador(req, res) {
    try {
      const { data: myNode } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('user_id', req.user.userId)
        .maybeSingle()

      const { data: targetNode } = await supabase
        .from('tree_nodes')
        .select('path, user_id')
        .eq('user_id', req.params.userId)
        .maybeSingle()

      if (!myNode || !targetNode || !isInNetwork(targetNode.path, myNode.id)) {
        return res.status(403).json({ error: 'User is not in your network' })
      }

      await supabase
        .from('users')
        .update({ status: 'active', active_date: new Date().toISOString() })
        .eq('id', req.params.userId)

      return res.json({ message: 'Ambassador activated' })
    } catch (err) {
      console.error('activateAmbassador error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
