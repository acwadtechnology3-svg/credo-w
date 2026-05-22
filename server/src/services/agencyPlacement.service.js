import { supabase } from '../lib/supabase.js'
import { treeService } from './tree.service.js'
import { treeActivationService } from './treeActivation.service.js'
import { resolveOptimalPlacementSide } from './invitation.service.js'
import { agencyPackageGateService } from './agencyPackageGate.service.js'
import { agencyRealtimeService } from './agencyRealtime.service.js'

export const agencyPlacementService = {
  async getNodeContext(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('id, sponsor_id, agency_id')
      .eq('id', userId)
      .single()

    const { data: node } = await supabase
      .from('tree_nodes')
      .select('id, parent_id, side, depth_level, path, user_id')
      .eq('user_id', userId)
      .maybeSingle()

    let parentUserId = null
    if (node?.parent_id) {
      const { data: parentNode } = await supabase
        .from('tree_nodes')
        .select('user_id')
        .eq('id', node.parent_id)
        .maybeSingle()
      parentUserId = parentNode?.user_id || null
    }

    return {
      user_id: userId,
      sponsor_user_id: user?.sponsor_id || null,
      parent_user_id: parentUserId,
      placement_side: node?.side || null,
      tree_node_id: node?.id || null,
      depth_level: node?.depth_level ?? null,
      agency_id: user?.agency_id || null,
    }
  },

  async assertNoDuplicateTreeNode(userId) {
    const { data } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (data) {
      throw Object.assign(new Error('المستخدم موجود بالفعل في الشجرة'), {
        status: 409,
        code: 'DUPLICATE_TREE_NODE',
      })
    }
  },

  async assertNoCycle(sponsorId, newUserId) {
    if (sponsorId === newUserId) {
      throw Object.assign(new Error('لا يمكن أن يكون الراعي هو نفس المستخدم'), { status: 400 })
    }

    const { data: sponsorNode } = await supabase
      .from('tree_nodes')
      .select('id, path')
      .eq('user_id', sponsorId)
      .maybeSingle()

    if (!sponsorNode) return

    const { data: newNode } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('user_id', newUserId)
      .maybeSingle()

    if (!newNode) return

    if (sponsorNode.path && sponsorNode.path.includes(`/${newNode.id}`)) {
      throw Object.assign(new Error('تعيين يُنشئ دورة في الشجرة'), {
        status: 400,
        code: 'CYCLE_DETECTED',
      })
    }
  },

  async previewPlacement(sponsorId, preferredSide = 'AUTO') {
    const side = await resolveOptimalPlacementSide(sponsorId, preferredSide)
    const { data: sponsorNode } = await supabase
      .from('tree_nodes')
      .select('id, depth_level')
      .eq('user_id', sponsorId)
      .single()

    if (!sponsorNode) {
      throw Object.assign(new Error('الراعي ليس في الشجرة بعد'), { status: 400 })
    }

    const { data: directChild } = await supabase
      .from('tree_nodes')
      .select('id, side')
      .eq('parent_id', sponsorNode.id)
      .eq('side', side)
      .maybeSingle()

    if (!directChild) {
      return {
        mode: 'direct',
        placement_side: side,
        parent_user_id: sponsorId,
        depth_level: (sponsorNode.depth_level || 0) + 1,
      }
    }

    return {
      mode: 'overflow_bfs',
      placement_side: side,
      parent_user_id: sponsorId,
      note: 'Slot under sponsor is full — will spill to next open leg via BFS',
    }
  },

  /**
   * Queue or immediately place user in binary tree with agency context.
   */
  async assignPlacement({
    userId,
    sponsorId,
    agencyId = null,
    placementSide = 'AUTO',
    source = 'agency',
    forceActivate = false,
  }) {
    if (!sponsorId) {
      throw Object.assign(new Error('الراعي مطلوب للتعيين'), { status: 400 })
    }

    const gate = await agencyPackageGateService.getParticipationContext(userId)
    const side = ['LEFT', 'RIGHT', 'AUTO'].includes((placementSide || '').toUpperCase())
      ? placementSide.toUpperCase()
      : 'AUTO'

    await supabase
      .from('users')
      .update({ sponsor_id: sponsorId, agency_id: agencyId || gate.agencyId })
      .eq('id', userId)

    if (!gate.canUsePlacement && !forceActivate) {
      await treeActivationService.queuePendingPlacement({
        userId,
        sponsorId,
        placementSide: side,
        agencyId: agencyId || gate.agencyId,
        source,
      })
      return { mode: 'queued', placement_side: side, sponsor_user_id: sponsorId }
    }

    await this.assertNoDuplicateTreeNode(userId)
    await this.assertNoCycle(sponsorId, userId)

    const node = await treeService.placeUser(sponsorId, side, userId)
    const ctx = await this.getNodeContext(userId)

    if (agencyId || gate.agencyId) {
      await agencyRealtimeService.emit(agencyId || gate.agencyId, 'placement_completed', {
        actorId: sponsorId,
        targetUserId: userId,
        payload: { side: ctx.placement_side, node_id: node?.id },
      })
    }

    return { mode: 'placed', node, ...ctx }
  },

  async manualPlace(adminUserId, { userId, sponsorId, placementSide, agencyId }) {
    await this.assertNoDuplicateTreeNode(userId)
    await agencyPackageGateService.assertAgencyParticipation(userId, { requirePackage: true })
    const result = await this.assignPlacement({
      userId,
      sponsorId,
      agencyId,
      placementSide,
      source: 'admin_override',
      forceActivate: true,
    })

    await supabase.from('agency_activity_logs').insert({
      agency_id: agencyId,
      actor_id: adminUserId,
      action: 'placement_override',
      details: { userId, sponsorId, placementSide },
    })

    return result
  },
}
