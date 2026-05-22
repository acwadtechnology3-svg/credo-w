import { supabase } from '../lib/supabase.js'

/** Package-gated binary tree access */
export const treeAccessService = {
  async getUserTreeContext(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'id, user_code, username, full_name, status, sponsor_id, agency_id, current_package_level, membership_status, tree_status, tree_onboarding_completed, tree_unlocked_at'
      )
      .eq('id', userId)
      .single()

    if (error) throw error

    const hasActivePackage =
      (user.membership_status === 'active' && (user.current_package_level || 0) > 0) ||
      (user.current_package_level || 0) > 0

    const { data: treeNode } = await supabase
      .from('tree_nodes')
      .select('id, side, parent_id, depth_level')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: pendingPlacement } = await supabase
      .from('pending_tree_placements')
      .select('id, sponsor_id, placement_side, status, source')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    const { data: pendingJoin } = await supabase
      .from('join_requests')
      .select('id, sponsor_id, placement_side, status, agency_id, created_at, expires_at')
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    const isTreeActive =
      hasActivePackage &&
      (user.tree_status === 'active' || !!treeNode) &&
      user.status === 'active'

    const needsOnboarding =
      hasActivePackage && isTreeActive && !user.tree_onboarding_completed

    const needsEntryWizard =
      hasActivePackage &&
      !treeNode &&
      !pendingPlacement?.sponsor_id &&
      user.tree_status !== 'active'

    return {
      user,
      hasActivePackage,
      isTreeActive,
      hasTreeNode: !!treeNode,
      treeNode,
      pendingPlacement,
      pendingJoinRequest: pendingJoin,
      treeStatus: user.tree_status || 'locked',
      needsOnboarding,
      needsEntryWizard,
      canViewLiveTree: isTreeActive && user.tree_onboarding_completed && !!treeNode,
      lockedReason: !hasActivePackage
        ? 'no_package'
        : user.status !== 'active'
          ? 'account_not_verified'
          : !isTreeActive
            ? 'pending_placement'
            : null,
    }
  },

  async assertCanApproveJoinRequest(requesterId) {
    const ctx = await this.getUserTreeContext(requesterId)
    if (!ctx.hasActivePackage) {
      throw Object.assign(new Error('لا يمكن الموافقة — المستخدم لا يملك باقة نشطة'), {
        status: 403,
        code: 'REQUESTER_NO_PACKAGE',
      })
    }
    if (ctx.user.status !== 'active') {
      throw Object.assign(new Error('لا يمكن الموافقة — حساب المستخدم غير مُفعّل'), {
        status: 403,
        code: 'REQUESTER_NOT_VERIFIED',
      })
    }
    const { data: paidPurchase } = await supabase
      .from('purchase_transactions')
      .select('id')
      .eq('user_id', requesterId)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle()

    if (!paidPurchase && (ctx.user.current_package_level || 0) > 0) {
      /* membership may be legacy-assigned */
    } else if (!paidPurchase) {
      throw Object.assign(new Error('لا يمكن الموافقة — لم يُؤكَّد الدفع'), {
        status: 403,
        code: 'PAYMENT_NOT_CONFIRMED',
      })
    }
    return ctx
  },
}
