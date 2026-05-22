import { supabase } from '../lib/supabase.js'
import { resolveAvatarDisplayUrl } from '../lib/avatarUrl.js'

const PACKAGE_LABELS = { 0: 'Free', 1: 'أحادي', 3: 'ثلاثي', 7: 'سباعي' }

export const networkEngineService = {
  async syncFromTree(userId, { strategy = null } = {}) {
    try {
      const { error } = await supabase.rpc('sync_network_node_from_tree', {
        p_user_id: userId,
        p_strategy: strategy,
      })
      if (error) throw error
    } catch {
      await this.syncFromTreeManual(userId, strategy)
    }
    return this.getNode(userId)
  },

  async syncFromTreeManual(userId, strategy) {
    const { data: tn } = await supabase.from('tree_nodes').select('*').eq('user_id', userId).maybeSingle()
    const { data: u } = await supabase
      .from('users')
      .select('sponsor_id, agency_id, rank_id, total_pv, commission_paid_total, direct_count')
      .eq('id', userId)
      .single()

    if (!u) return null

    const { data: logs } = await supabase.from('bv_logs').select('side, amount').eq('user_id', userId)
    let left = 0
    let right = 0
    for (const l of logs || []) {
      if (l.side === 'LEFT') left += parseFloat(l.amount) || 0
      else right += parseFloat(l.amount) || 0
    }
    const weak = Math.min(left, right)
    const strong = Math.max(left, right)

    const row = {
      user_id: userId,
      tree_node_id: tn?.id,
      sponsor_id: u.sponsor_id,
      placement_parent_id: tn?.parent_id,
      placement_side: tn?.side,
      level_depth: tn?.depth_level || 0,
      agency_id: u.agency_id,
      current_rank_id: u.rank_id,
      total_pv: u.total_pv || 0,
      total_gv: left + right,
      left_volume: left,
      right_volume: right,
      weak_leg_volume: weak,
      strong_leg_volume: strong,
      lifetime_earnings: u.commission_paid_total || 0,
      direct_recruits: u.direct_count || 0,
      placement_strategy: strategy,
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    await supabase.from('network_nodes').upsert(row, { onConflict: 'user_id' })
    await supabase.from('network_volumes').upsert(
      {
        user_id: userId,
        pv: row.total_pv,
        gv: row.total_gv,
        tv: row.total_gv,
        bv: row.total_gv,
        cv: row.lifetime_earnings,
        left_bv: left,
        right_bv: right,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    return row
  },

  async getNode(userId) {
    const { data } = await supabase.from('network_nodes').select('*').eq('user_id', userId).maybeSingle()
    return data
  },

  async getAnalytics(userId) {
    const { data: user } = await supabase
      .from('users')
      .select(
        'id, direct_count, total_pv, current_package_level, membership_status, ranks(name), agency_id'
      )
      .eq('id', userId)
      .single()

    const { data: nn } = await supabase.from('network_nodes').select('*').eq('user_id', userId).maybeSingle()
    const { data: vol } = await supabase.from('network_volumes').select('*').eq('user_id', userId).maybeSingle()
    const { data: legs } = await supabase
      .from('network_leg_statistics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: myNode } = await supabase
      .from('tree_nodes')
      .select('id, path')
      .eq('user_id', userId)
      .maybeSingle()

    let totalNetwork = 0
    let activeMembers = 0
    let inactiveMembers = 0
    const packageDistribution = { 0: 0, 1: 0, 3: 0, 7: 0 }

    if (myNode) {
      const { count } = await supabase
        .from('tree_nodes')
        .select('*', { count: 'exact', head: true })
        .like('path', `%${myNode.id}%`)
      totalNetwork = Math.max(0, (count || 1) - 1)

      const { data: downlineNodes } = await supabase
        .from('tree_nodes')
        .select('user_id')
        .like('path', `%${myNode.id}%`)
        .neq('user_id', userId)
        .limit(500)

      const ids = (downlineNodes || []).map((n) => n.user_id)
      if (ids.length) {
        const { data: members } = await supabase
          .from('users')
          .select('membership_status, current_package_level')
          .in('id', ids)

        for (const m of members || []) {
          const lvl = m.current_package_level || 0
          packageDistribution[lvl] = (packageDistribution[lvl] || 0) + 1
          if (m.membership_status === 'active' && lvl > 0) activeMembers++
          else inactiveMembers++
        }
      }
    }

    const { data: directs } = await supabase
      .from('users')
      .select('id, username, current_package_level, membership_status')
      .eq('sponsor_id', userId)
      .limit(50)

    return {
      directRecruits: user?.direct_count || 0,
      totalNetworkSize: totalNetwork,
      leftVolume: nn?.left_volume ?? vol?.left_bv ?? 0,
      rightVolume: nn?.right_volume ?? vol?.right_bv ?? 0,
      weakLeg: legs?.weak_leg ?? vol?.weak_leg,
      strongLeg: legs?.strong_leg,
      carryOver: legs?.carry_over ?? vol?.carry_over ?? 0,
      pv: vol?.pv ?? nn?.total_pv ?? 0,
      gv: vol?.gv ?? nn?.total_gv ?? 0,
      tv: vol?.tv ?? 0,
      bv: vol?.bv ?? 0,
      cv: vol?.cv ?? nn?.lifetime_earnings ?? 0,
      activeMembers,
      inactiveMembers,
      packageDistribution,
      rank: user?.ranks?.name,
      packageLevel: user?.current_package_level,
      packageLabel: PACKAGE_LABELS[user?.current_package_level] || '—',
      expansionEnergyPct: legs?.expansion_energy_pct ?? 0,
      growthStreakDays: legs?.growth_streak_days ?? 0,
      directs: directs || [],
    }
  },

  async recordActivity({
    eventType,
    actorId,
    targetUserId,
    sponsorId,
    agencyId,
    title,
    body,
    icon = '⚡',
    severity = 'info',
    payload = {},
  }) {
    const { data, error } = await supabase
      .from('network_activity_feed')
      .insert({
        agency_id: agencyId || null,
        event_type: eventType,
        actor_id: actorId,
        target_user_id: targetUserId,
        sponsor_id: sponsorId,
        title,
        body,
        icon,
        severity,
        payload,
        is_public: true,
      })
      .select()
      .single()

    if (error) throw error

    try {
      const { agencyRealtimeService } = await import('./agencyRealtime.service.js')
      if (agencyId) {
        await agencyRealtimeService.emit(agencyId, 'network_activity', {
          actorId,
          targetUserId,
          payload: { feed_id: data.id, ...payload, title, body },
        })
      }
    } catch {
      /* socket optional */
    }

    return data
  },

  async getActivityFeed({ agencyId, userId, limit = 30 } = {}) {
    let q = supabase
      .from('network_activity_feed')
      .select(
        `
        id, event_type, title, body, icon, severity, payload, created_at,
        actor:users!network_activity_feed_actor_id_fkey(id, username, full_name, profile_image),
        target:users!network_activity_feed_target_user_id_fkey(id, username, full_name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (agencyId) {
      q = q.eq('agency_id', agencyId)
    }

    const { data, error } = await q
    if (error) throw error

    const rows = []
    for (const row of data || []) {
      let profile_image = row.actor?.profile_image
      if (profile_image) profile_image = await resolveAvatarDisplayUrl(profile_image)
      rows.push({ ...row, actor: row.actor ? { ...row.actor, profile_image } : null })
    }
    return rows
  },

  async getEntrySession(userId) {
    const { data } = await supabase
      .from('network_entry_sessions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    return data
  },

  async upsertEntrySession(userId, patch) {
    const { data, error } = await supabase
      .from('network_entry_sessions')
      .upsert(
        { user_id: userId, ...patch, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async completeEntry(userId, { sponsorId, placementSide, placementMode, agencyId }) {
    const session = await this.upsertEntrySession(userId, {
      sponsor_id: sponsorId,
      expansion_side: placementSide,
      placement_mode: placementMode,
      agency_id: agencyId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })

    const { placementEngineService } = await import('./placementEngine.service.js')
    const { treeActivationService } = await import('./treeActivation.service.js')

    await treeActivationService.queuePendingPlacement({
      userId,
      sponsorId,
      placementSide: placementSide || 'AUTO',
      agencyId,
      source: 'entry_wizard',
    })

    const result = await treeActivationService.activateForUser(userId)
    return { session, activation: result }
  },

  async adminMovePlacement({
    userId,
    newParentUserId,
    side,
    adminUserId,
    reason,
  }) {
    const { data: node } = await supabase.from('tree_nodes').select('*').eq('user_id', userId).single()
    if (!node) throw Object.assign(new Error('العضو غير موجود في الشجرة'), { status: 404 })

    const { data: newParent } = await supabase
      .from('tree_nodes')
      .select('id, depth_level, path')
      .eq('user_id', newParentUserId)
      .single()

    if (!newParent) throw Object.assign(new Error('الموضع الجديد غير صالح'), { status: 400 })

    const pref = side?.toUpperCase() === 'RIGHT' ? 'RIGHT' : 'LEFT'
    const { data: occupant } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('parent_id', newParent.id)
      .eq('side', pref)
      .maybeSingle()

    if (occupant && occupant.id !== node.id) {
      throw Object.assign(new Error('الموضع مشغول'), { status: 409 })
    }

    const newPath = newParent.path ? `${newParent.path}/${newParent.id}` : `/${newParent.id}`

    const { data: updated, error } = await supabase
      .from('tree_nodes')
      .update({
        parent_id: newParent.id,
        side: pref,
        depth_level: newParent.depth_level + 1,
        path: newPath,
      })
      .eq('id', node.id)
      .select()
      .single()

    if (error) throw error

    await supabase.from('network_positions').insert({
      user_id: userId,
      tree_node_id: updated.id,
      placement_parent_id: newParent.id,
      placement_side: pref,
      strategy: 'ADMIN_OVERRIDE',
      placed_by: adminUserId,
      is_override: true,
      notes: reason,
    })

    await this.syncFromTree(userId, { strategy: 'ADMIN_OVERRIDE' })
    await this.recordActivity({
      eventType: 'placement_moved',
      actorId: adminUserId,
      targetUserId: userId,
      title: 'تم نقل موضع في الشجرة',
      body: reason || 'تعديل إداري',
      severity: 'warning',
      payload: { new_parent: newParentUserId, side: pref },
    })

    return updated
  },

  async adminFreezeNode(userId, { frozen = true, reason, adminUserId }) {
    await supabase
      .from('network_nodes')
      .upsert(
        {
          user_id: userId,
          is_frozen: frozen,
          frozen_at: frozen ? new Date().toISOString() : null,
          frozen_reason: reason,
          status: frozen ? 'frozen' : 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (frozen) {
      await supabase.from('users').update({ tree_status: 'suspended' }).eq('id', userId)
    }

    await this.recordActivity({
      eventType: frozen ? 'node_frozen' : 'node_unfrozen',
      actorId: adminUserId,
      targetUserId: userId,
      title: frozen ? 'تم تجميد العقدة' : 'تم إلغاء التجميد',
      body: reason,
      severity: 'warning',
    })
  },

  async adminSearchNetwork(query, { limit = 30 } = {}) {
    const q = (query || '').trim()
    if (q.length < 2) return []

    const { data: users } = await supabase
      .from('users')
      .select('id, user_code, username, full_name, tree_status, current_package_level')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,user_code.ilike.%${q}%`)
      .limit(limit)

    const enriched = []
    for (const u of users || []) {
      const nn = await this.getNode(u.id)
      enriched.push({ ...u, network: nn })
    }
    return enriched
  },
}
