import { supabase } from '../lib/supabase.js'
import { treeService } from './tree.service.js'
import { placementEngineService } from './placementEngine.service.js'
import { notifyUser } from '../lib/notify.js'

/**
 * Deferred binary tree placement — activates only after package purchase / approval.
 */
export const treeActivationService = {
  async queuePendingPlacement({
    userId,
    sponsorId,
    placementSide = 'AUTO',
    agencyId = null,
    source = 'registration',
    joinRequestId = null,
  }) {
    const side = ['LEFT', 'RIGHT', 'AUTO'].includes((placementSide || '').toUpperCase())
      ? placementSide.toUpperCase()
      : 'AUTO'

    await supabase
      .from('users')
      .update({ tree_status: 'pending_placement' })
      .eq('id', userId)

    const { data: existing } = await supabase
      .from('pending_tree_placements')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle()

    const row = {
      sponsor_id: sponsorId,
      agency_id: agencyId,
      placement_side: side,
      source,
      join_request_id: joinRequestId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase
        .from('pending_tree_placements')
        .update(row)
        .eq('id', existing.id)
      if (error) throw error
      return existing.id
    }

    const { data, error } = await supabase
      .from('pending_tree_placements')
      .insert({ user_id: userId, ...row })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  },

  async activateForUser(userId, { isFirstPurchase = false } = {}) {
    const { data: user } = await supabase
      .from('users')
      .select('id, membership_status, current_package_level, status, sponsor_id')
      .eq('id', userId)
      .single()

    const hasPackage =
      user?.membership_status === 'active' && (user?.current_package_level || 0) > 0

    if (!hasPackage) {
      return { activated: false, reason: 'no_active_package' }
    }

    const { data: existingNode } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingNode) {
      await supabase
        .from('users')
        .update({
          tree_status: 'active',
          tree_unlocked_at: new Date().toISOString(),
        })
        .eq('id', userId)
      return { activated: true, alreadyPlaced: true, nodeId: existingNode.id }
    }

    const { count: treeNodeCount } = await supabase
      .from('tree_nodes')
      .select('*', { count: 'exact', head: true })

    const { data: pending } = await supabase
      .from('pending_tree_placements')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    let node
    try {
      if ((treeNodeCount || 0) === 0) {
        node = await treeService.placeRoot(userId)
        try {
          const { networkEngineService } = await import('./networkEngine.service.js')
          await networkEngineService.syncFromTree(userId, { strategy: 'ROOT' })
        } catch {
          /* network tables optional until migration */
        }
      } else if (pending?.sponsor_id) {
        const placed = await placementEngineService.placeMember({
          sponsorUserId: pending.sponsor_id,
          newUserId: userId,
          strategy: pending.placement_side || 'AUTO',
          manualSide: ['LEFT', 'RIGHT'].includes(pending.placement_side) ? pending.placement_side : null,
          agencyId: pending.agency_id,
        })
        node = placed.node
      } else if (user.sponsor_id) {
        const placed = await placementEngineService.placeMember({
          sponsorUserId: user.sponsor_id,
          newUserId: userId,
          strategy: 'AUTO_BALANCE',
          agencyId: pending?.agency_id,
        })
        node = placed.node
      } else {
        return { activated: false, reason: 'no_sponsor_for_placement' }
      }
    } catch (e) {
      if (pending) {
        await supabase
          .from('pending_tree_placements')
          .update({ status: 'failed', error_message: e.message })
          .eq('id', pending.id)
      }
      throw e
    }

    const now = new Date().toISOString()
    await supabase
      .from('users')
      .update({
        tree_status: 'active',
        tree_unlocked_at: now,
      })
      .eq('id', userId)

    if (pending) {
      await supabase
        .from('pending_tree_placements')
        .update({ status: 'activated', activated_at: now })
        .eq('id', pending.id)
    }

    const { data: openRequests } = await supabase
      .from('join_requests')
      .select('id')
      .eq('requester_id', userId)
      .eq('status', 'pending')

    for (const jr of openRequests || []) {
      await supabase
        .from('join_requests')
        .update({
          status: 'approved',
          approved_at: now,
          approved_by: pending?.sponsor_id || user.sponsor_id,
          placement_node_id: node?.id,
        })
        .eq('id', jr.id)
    }

    if (isFirstPurchase) {
      try {
        const { treeOnboardingService } = await import('./treeOnboarding.service.js')
        await treeOnboardingService.ensureProgress(userId)
      } catch {
        /* onboarding tables may not exist */
      }
    }

    try {
      const { emitOrgEvent } = await import('../lib/organizationEvents.js')
      await emitOrgEvent(userId, 'tree_activated', {
        title: '🔥 تم تفعيل موقعك في الشجرة',
        body: 'شبكتك الثنائية أصبحت نشطة',
        payload: { nodeId: node?.id },
      })
    } catch {
      /* optional */
    }

    try {
      await notifyUser(userId, {
        type: 'TREE_ACTIVATED',
        title: '🔥 موقعك في الشبكة أصبح نشطاً',
        body: 'تم تفعيل موضعك في الشجرة الثنائية — أكمل التعريف لفتح لوحة التحكم الكاملة',
      })
      if (pending?.sponsor_id) {
        await notifyUser(pending.sponsor_id, {
          type: 'DOWNLINE_PLACED',
          title: 'عضو جديد في شجرتك',
          body: 'تم وضع عضو في فريقك بعد تفعيل باقته',
        })
      }
    } catch {
      /* notifications optional */
    }

    try {
      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (member?.agency_id) {
        const { agencyRealtimeService } = await import('./agencyRealtime.service.js')
        await agencyRealtimeService.emit(member.agency_id, 'package_activated', {
          targetUserId: userId,
          payload: { node_id: node?.id, is_first_purchase: isFirstPurchase },
        })
        if (node) {
          await agencyRealtimeService.emit(member.agency_id, 'placement_completed', {
            actorId: pending?.sponsor_id || user.sponsor_id,
            targetUserId: userId,
            payload: { node_id: node.id },
          })
        }
      }
    } catch {
      /* agency realtime optional */
    }

    return { activated: true, node, isFirstPurchase }
  },

  async suspendOnPaymentReversal(userId) {
    await supabase
      .from('users')
      .update({ tree_status: 'suspended', membership_status: 'unsubscribed' })
      .eq('id', userId)

    await notifyUser(userId, {
      type: 'TREE_SUSPENDED',
      title: 'تم تعليق موقعك في الشبكة',
      body: 'بسبب عكس عملية دفع — تواصل مع الدعم',
    })
  },
}
