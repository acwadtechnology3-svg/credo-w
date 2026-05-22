import { supabase } from '../lib/supabase.js'
import { resolveAvatarDisplayUrl } from '../lib/avatarUrl.js'
import { getLevelName } from '../lib/packageRules.js'

const PACKAGE_LABELS = { 0: 'Free', 1: 'أحادي', 3: 'ثلاثي', 7: 'سباعي' }

async function getLegBv(userId) {
  const { data: logs } = await supabase
    .from('bv_logs')
    .select('side, amount')
    .eq('user_id', userId)

  let left = 0
  let right = 0
  for (const l of logs || []) {
    if (l.side === 'LEFT') left += parseFloat(l.amount) || 0
    else right += parseFloat(l.amount) || 0
  }
  return { leftBv: left, rightBv: right, totalBv: left + right }
}

async function countDownline(nodeId) {
  const { count } = await supabase
    .from('tree_nodes')
    .select('*', { count: 'exact', head: true })
    .like('path', `%${nodeId}%`)
  return Math.max(0, (count || 1) - 1)
}

export const treeNetworkService = {
  async getMemberCard(userId, { actorUserId = null } = {}) {
    const { data: user } = await supabase
      .from('users')
      .select(
        `
        id, user_code, username, full_name, profile_image, status, sponsor_id,
        current_package_level, membership_status, direct_count, total_pv,
        commission_paid_total, created_at, active_date, agency_id,
        tree_onboarding_completed, ranks(name, sort_order)
      `
      )
      .eq('id', userId)
      .single()

    if (!user) return null

    const { data: treeNode } = await supabase
      .from('tree_nodes')
      .select('id, side, parent_id, depth_level, path, placed_at')
      .eq('user_id', userId)
      .maybeSingle()

    let sponsorName = null
    if (user.sponsor_id) {
      const { data: sp } = await supabase
        .from('users')
        .select('username, full_name, user_code')
        .eq('id', user.sponsor_id)
        .maybeSingle()
      sponsorName = sp?.full_name || sp?.username
    }

    let agencyRole = null
    let agencyName = null
    let agencyColor = null
    if (user.agency_id) {
      const { data: mem } = await supabase
        .from('agency_members')
        .select('role, agencies(name, slug, theme_color)')
        .eq('user_id', userId)
        .eq('agency_id', user.agency_id)
        .eq('status', 'active')
        .maybeSingle()
      agencyRole = mem?.role
      agencyName = mem?.agencies?.name
      agencyColor = mem?.agencies?.theme_color
    }

    const { data: presence } = await supabase
      .from('user_presence')
      .select('is_online, last_seen_at')
      .eq('user_id', userId)
      .maybeSingle()

    const bv = await getLegBv(userId)
    const teamSize = treeNode ? await countDownline(treeNode.id) : 0

    const profile_image = user.profile_image
      ? await resolveAvatarDisplayUrl(user.profile_image)
      : null

    const isFounder = ['owner', 'founder'].includes(agencyRole)
    const isEliteRecruiter = (user.direct_count || 0) >= 10

    return {
      id: user.id,
      user_code: user.user_code,
      username: user.username,
      full_name: user.full_name,
      profile_image,
      status: user.status,
      rank: user.ranks?.name || 'BAP',
      rankSort: user.ranks?.sort_order || 0,
      packageLevel: user.current_package_level || 0,
      packageLabel: PACKAGE_LABELS[user.current_package_level] || getLevelName(user.current_package_level),
      placementSide: treeNode?.side,
      depthLevel: treeNode?.depth_level,
      leftBv: bv.leftBv,
      rightBv: bv.rightBv,
      totalBv: bv.totalBv,
      cv: parseFloat(user.commission_paid_total) || 0,
      pv: parseFloat(user.total_pv) || 0,
      directCount: user.direct_count || 0,
      teamSize,
      sponsorName,
      agencyRole,
      agencyName,
      agencyColor,
      isOnline: presence?.is_online ?? false,
      lastSeenAt: presence?.last_seen_at,
      joinDate: user.active_date || user.created_at,
      isFounder,
      isEliteRecruiter,
      onboardingComplete: user.tree_onboarding_completed,
      treeNodeId: treeNode?.id,
    }
  },

  async loadChildren(nodeId, { depth = 1 } = {}) {
    const { data: children } = await supabase
      .from('tree_nodes')
      .select('id, user_id, side')
      .eq('parent_id', nodeId)

    const result = []
    for (const c of children || []) {
      const card = await this.getMemberCard(c.user_id)
      const entry = { nodeId: c.id, side: c.side, member: card }
      if (depth > 1) {
        entry.children = await this.loadChildren(c.id, { depth: depth - 1 })
      }
      result.push(entry)
    }
    return result
  },

  async buildFlowGraph(actorUserId, { maxDepth = 4, expandedIds = [] } = {}) {
    const { data: myNode } = await supabase
      .from('tree_nodes')
      .select('id, user_id, path')
      .eq('user_id', actorUserId)
      .maybeSingle()

    if (!myNode) return { nodes: [], edges: [], rootId: null }

    const nodes = []
    const edges = []
    const visited = new Set()

    const walk = async (nodeId, depth, parentFlowId = null, branchSide = null) => {
      if (depth > maxDepth || visited.has(nodeId)) return
      visited.add(nodeId)

      const { data: tn } = await supabase
        .from('tree_nodes')
        .select('id, user_id, side, parent_id')
        .eq('id', nodeId)
        .single()

      if (!tn) return

      const card = await this.getMemberCard(tn.user_id, { actorUserId })
      const flowId = `n-${tn.id}`
      const isExpanded = expandedIds.includes(tn.id) || depth < 2

      nodes.push({
        id: flowId,
        type: 'memberNode',
        position: { x: 0, y: 0 },
        data: { ...card, treeNodeId: tn.id, branchSide: branchSide || tn.side, isYou: tn.user_id === actorUserId },
      })

      if (parentFlowId) {
        edges.push({
          id: `e-${parentFlowId}-${flowId}`,
          source: parentFlowId,
          target: flowId,
          type: 'glow',
          data: { side: tn.side },
        })
      }

      if (!isExpanded) return

      const { data: kids } = await supabase
        .from('tree_nodes')
        .select('id, side')
        .eq('parent_id', nodeId)

      for (const k of kids || []) {
        await walk(k.id, depth + 1, flowId, k.side)
      }
    }

    await walk(myNode.id, 0)

    this.layoutFlow(nodes, edges, `n-${myNode.id}`)

    return { nodes, edges, rootId: `n-${myNode.id}`, centerNodeId: myNode.id }
  },

  layoutFlow(nodes, edges, rootFlowId) {
    const childrenMap = {}
    for (const e of edges) {
      if (!childrenMap[e.source]) childrenMap[e.source] = []
      childrenMap[e.source].push(e.target)
    }
    const hSpacing = 200
    const vSpacing = 130

    const assign = (flowId, x, depth) => {
      const node = nodes.find((n) => n.id === flowId)
      if (node) node.position = { x, y: depth * vSpacing }
      const kids = childrenMap[flowId] || []
      kids.forEach((kidId, i) => {
        const offset = (i - (kids.length - 1) / 2) * hSpacing
        assign(kidId, x + offset, depth + 1)
      })
    }
    assign(rootFlowId, 0, 0)
  },

  async searchNetwork(actorUserId, query) {
    const q = (query || '').trim().toLowerCase()
    if (q.length < 2) return []

    const { data: myNode } = await supabase
      .from('tree_nodes')
      .select('id, path')
      .eq('user_id', actorUserId)
      .maybeSingle()

    if (!myNode) return []

    const { data: nodes } = await supabase
      .from('tree_nodes')
      .select('user_id, id')
      .like('path', `%${myNode.id}%`)
      .limit(200)

    const userIds = (nodes || []).map((n) => n.user_id)
    if (!userIds.length) return []

    const { data: users } = await supabase
      .from('users')
      .select('id, username, full_name, user_code, profile_image')
      .in('id', userIds)
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,user_code.ilike.%${q}%`)
      .limit(20)

    const cards = []
    for (const u of users || []) {
      cards.push(await this.getMemberCard(u.id))
    }
    return cards
  },

  async updatePresence(userId, socketId, isOnline = true) {
    await supabase.from('user_presence').upsert(
      {
        user_id: userId,
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
        socket_id: socketId,
      },
      { onConflict: 'user_id' }
    )
  },
}
