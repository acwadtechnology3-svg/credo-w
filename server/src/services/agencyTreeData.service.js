import { supabase } from '../lib/supabase.js'
import { agencyPackageGateService } from './agencyPackageGate.service.js'
import { agencyPlacementService } from './agencyPlacement.service.js'
import { bvService } from './bv.service.js'
import { hasAgencyPermission } from '../lib/agencyRoles.js'

const NODE_SELECT =
  'id, user_id, parent_id, side, depth_level, path, users(id, username, full_name, user_code, profile_image, current_package_level, agency_id, sponsor_id, ranks(name))'

function compactNode(row, { includeChildren = false } = {}) {
  if (!row) return null
  const u = row.users || {}
  return {
    node_id: row.id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    placement_side: row.side,
    depth_level: row.depth_level,
    path: row.path,
    username: u.username,
    full_name: u.full_name,
    user_code: u.user_code,
    profile_image: u.profile_image,
    rank: u.ranks?.name,
    package_level: u.current_package_level,
    agency_id: u.agency_id,
    sponsor_user_id: u.sponsor_id,
    children: includeChildren ? [] : undefined,
  }
}

async function assertTreeView(userId, agencyId) {
  const gate = await agencyPackageGateService.getParticipationContext(userId)
  if (!gate.hasActivePackage) {
    return {
      locked: true,
      lockedCta: gate.lockedCta,
      canView: false,
    }
  }
  if (agencyId && gate.agencyId && gate.agencyId !== agencyId) {
    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
    if (!['super_admin', 'admin'].includes(user?.role)) {
      const { data: membership } = await supabase
        .from('agency_members')
        .select('role')
        .eq('agency_id', agencyId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (!membership) throw Object.assign(new Error('Forbidden'), { status: 403 })
    }
  }
  return { locked: false, canView: true, gate }
}

export const agencyTreeDataService = {
  async getNode(userId, targetUserId, agencyId = null) {
    const access = await assertTreeView(userId, agencyId)
    if (!access.canView) return { locked: true, lockedCta: access.lockedCta }

    const targetId = targetUserId || userId
    const { data: node } = await supabase
      .from('tree_nodes')
      .select(NODE_SELECT)
      .eq('user_id', targetId)
      .maybeSingle()

    if (!node) {
      return {
        locked: false,
        node: null,
        placement: await agencyPlacementService.getNodeContext(targetId).catch(() => null),
      }
    }

    const legs = await bvService.getUserBVTotals(targetId).catch(() => null)
    const placement = await agencyPlacementService.getNodeContext(targetId)

    return {
      locked: false,
      node: compactNode(node),
      bv: legs,
      placement,
    }
  },

  async getSubtree(userId, rootUserId, { depth = 3, agencyId = null } = {}) {
    const access = await assertTreeView(userId, agencyId)
    if (!access.canView) return { locked: true, lockedCta: access.lockedCta }

    const rootId = rootUserId || userId
    const maxDepth = Math.min(6, Math.max(1, depth))

    const { data: rootNode } = await supabase
      .from('tree_nodes')
      .select(NODE_SELECT)
      .eq('user_id', rootId)
      .maybeSingle()

    if (!rootNode) {
      return { locked: false, root: null, nodes: [], edges: [] }
    }

    const queue = [{ node: rootNode, level: 0 }]
    const nodes = []
    const edges = []
    const seen = new Set()

    while (queue.length > 0) {
      const { node, level } = queue.shift()
      if (seen.has(node.id)) continue
      seen.add(node.id)
      nodes.push(compactNode(node))

      if (level >= maxDepth) continue

      const { data: children } = await supabase
        .from('tree_nodes')
        .select(NODE_SELECT)
        .eq('parent_id', node.id)
        .order('side', { ascending: true })
        .limit(2)

      for (const child of children || []) {
        edges.push({
          from: node.user_id,
          to: child.user_id,
          side: child.side,
        })
        queue.push({ node: child, level: level + 1 })
      }
    }

    return {
      locked: false,
      root: compactNode(rootNode),
      depth: maxDepth,
      node_count: nodes.length,
      nodes,
      edges,
    }
  },

  async expandNode(userId, nodeUserId, agencyId = null) {
    return this.getSubtree(userId, nodeUserId, { depth: 2, agencyId })
  },

  async collapseNode(userId, nodeUserId, agencyId = null) {
    const result = await this.getNode(userId, nodeUserId, agencyId)
    return { ...result, collapsed: true }
  },

  async searchMembers(userId, agencyId, query, limit = 25) {
    await assertTreeView(userId, agencyId)
    const q = String(query || '').trim()
    if (q.length < 2) return []

    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .limit(500)

    const ids = (members || []).map((m) => m.user_id)
    if (!ids.length) return []

    const { data: users } = await supabase
      .from('users')
      .select('id, username, full_name, user_code, profile_image')
      .in('id', ids)
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,user_code.ilike.%${q}%`)
      .limit(limit)

    const results = []
    for (const u of users || []) {
      const { data: node } = await supabase
        .from('tree_nodes')
        .select('id, side, depth_level')
        .eq('user_id', u.id)
        .maybeSingle()
      results.push({ user: u, tree: node })
    }
    return results
  },

  async traceSponsor(userId, targetUserId, agencyId = null) {
    await assertTreeView(userId, agencyId)
    const chain = []
    let currentId = targetUserId || userId
    const visited = new Set()

    for (let i = 0; i < 50; i++) {
      if (!currentId || visited.has(currentId)) break
      visited.add(currentId)

      const { data: user } = await supabase
        .from('users')
        .select('id, username, full_name, user_code, sponsor_id, agency_id')
        .eq('id', currentId)
        .single()

      if (!user) break
      chain.push(user)
      if (!user.sponsor_id) break
      currentId = user.sponsor_id
    }

    return { chain }
  },

  async getPlacementVisualization(userId, sponsorUserId, placementSide = 'AUTO') {
    const gate = await agencyPackageGateService.getParticipationContext(userId)
    if (!sponsorUserId) {
      return { locked: !gate.canUsePlacement, lockedCta: gate.lockedCta, preview: null }
    }
    try {
      const preview = await agencyPlacementService.previewPlacement(
        sponsorUserId,
        placementSide
      )
      return { locked: false, preview }
    } catch (e) {
      return { locked: false, error: e.message, preview: null }
    }
  },

  async getAgencyTreeScope(userId, agencyId) {
    const { data: membership } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    const { data: platformUser } = await supabase.from('users').select('role').eq('id', userId).single()
    const isPlatform = ['super_admin', 'admin'].includes(platformUser?.role)
    if (
      !isPlatform &&
      (!membership || !hasAgencyPermission(membership.role, 'view_tree'))
    ) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('founder_id, owner_id, branding_json')
      .eq('id', agencyId)
      .single()

    const rootUserId =
      agency?.branding_json?.sponsor_root_user_id || agency?.founder_id || agency?.owner_id

    return this.getSubtree(userId, rootUserId, { depth: 4, agencyId })
  },
}
