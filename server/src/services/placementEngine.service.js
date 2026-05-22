import { supabase } from '../lib/supabase.js'
import { treeService } from './tree.service.js'

const STRATEGIES = ['LEFT', 'RIGHT', 'AUTO_BALANCE', 'WEAKER_LEG', 'STRONGER_LEG', 'AUTO']

/**
 * Binary placement engine — sponsor ≠ placement parent.
 * Strategies: LEFT, RIGHT, AUTO_BALANCE, WEAKER_LEG, STRONGER_LEG (AUTO alias).
 */
export const placementEngineService = {
  async getDefaultStrategy(agencyId = null) {
    let q = supabase
      .from('network_placement_settings')
      .select('default_strategy, allow_manual, config_json')
      .eq('scope', agencyId ? 'agency' : 'global')

    if (agencyId) q = q.eq('agency_id', agencyId)
    else q = q.is('agency_id', null)

    const { data } = await q.maybeSingle()
    if (data) return data

    const { data: global } = await supabase
      .from('network_placement_settings')
      .select('default_strategy, allow_manual, config_json')
      .eq('scope', 'global')
      .is('agency_id', null)
      .maybeSingle()

    return global || { default_strategy: 'AUTO_BALANCE', allow_manual: true, config_json: {} }
  },

  normalizeStrategy(raw) {
    const s = (raw || 'AUTO').toUpperCase().replace(/\s+/g, '_')
    if (s === 'AUTO') return 'AUTO_BALANCE'
    if (STRATEGIES.includes(s)) return s
    return 'AUTO_BALANCE'
  },

  async getLegVolumes(sponsorUserId) {
    const { data: logs } = await supabase
      .from('bv_logs')
      .select('side, amount')
      .eq('user_id', sponsorUserId)

    let left = 0
    let right = 0
    for (const l of logs || []) {
      if (l.side === 'LEFT') left += parseFloat(l.amount) || 0
      else right += parseFloat(l.amount) || 0
    }
    return { left, right, weak: Math.min(left, right), strong: Math.max(left, right) }
  },

  /** Resolve preferred binary side before BFS spillover */
  async resolvePreferredSide(sponsorUserId, strategy, manualSide = null) {
    const strat = this.normalizeStrategy(strategy)

    if (strat === 'MANUAL_ONLY' && manualSide) {
      return manualSide === 'RIGHT' ? 'RIGHT' : 'LEFT'
    }
    if (manualSide && ['LEFT', 'RIGHT'].includes(manualSide.toUpperCase())) {
      return manualSide.toUpperCase()
    }
    if (strat === 'LEFT') return 'LEFT'
    if (strat === 'RIGHT') return 'RIGHT'

    const legs = await this.getLegVolumes(sponsorUserId)

    if (strat === 'WEAKER_LEG') {
      if (legs.left < legs.right) return 'LEFT'
      if (legs.right < legs.left) return 'RIGHT'
      return 'LEFT'
    }
    if (strat === 'STRONGER_LEG') {
      if (legs.left > legs.right) return 'LEFT'
      if (legs.right > legs.left) return 'RIGHT'
      return 'LEFT'
    }

    // AUTO_BALANCE — fill emptier immediate slot, else weaker leg
    const { data: sponsorNode } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('user_id', sponsorUserId)
      .single()

    if (sponsorNode) {
      const { data: leftChild } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('parent_id', sponsorNode.id)
        .eq('side', 'LEFT')
        .maybeSingle()
      const { data: rightChild } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('parent_id', sponsorNode.id)
        .eq('side', 'RIGHT')
        .maybeSingle()
      if (!leftChild) return 'LEFT'
      if (!rightChild) return 'RIGHT'
    }

    if (legs.left <= legs.right) return 'LEFT'
    return 'RIGHT'
  },

  async validateManualSlot(sponsorUserId, side) {
    const pref = side?.toUpperCase()
    if (!['LEFT', 'RIGHT'].includes(pref)) {
      throw Object.assign(new Error('يجب اختيار يسار أو يمين'), { status: 400 })
    }

    const { data: sponsorNode } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('user_id', sponsorUserId)
      .single()

    if (!sponsorNode) {
      throw Object.assign(new Error('الراعي ليس في الشجرة بعد'), { status: 400 })
    }

    const { data: directChild } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('parent_id', sponsorNode.id)
      .eq('side', pref)
      .maybeSingle()

    return { sponsorNode, directOccupied: !!directChild, side: pref, willSpillover: !!directChild }
  },

  async previewPlacement({ sponsorUserId, strategy, manualSide, agencyId }) {
    const settings = await this.getDefaultStrategy(agencyId)
    const strat = this.normalizeStrategy(strategy || settings.default_strategy)
    const side = await this.resolvePreferredSide(sponsorUserId, strat, manualSide)
    const validation = await this.validateManualSlot(sponsorUserId, side).catch(() => null)

    const legs = await this.getLegVolumes(sponsorUserId)

    return {
      strategy: strat,
      resolvedSide: side,
      willSpillover: validation?.willSpillover ?? false,
      leftBv: legs.left,
      rightBv: legs.right,
      weakerLeg: legs.left <= legs.right ? 'LEFT' : 'RIGHT',
      allowManual: settings.allow_manual !== false,
    }
  },

  async placeMember({
    sponsorUserId,
    newUserId,
    strategy,
    manualSide = null,
    placedBy = null,
    isOverride = false,
    agencyId = null,
  }) {
    const settings = await this.getDefaultStrategy(agencyId)
    const strat = this.normalizeStrategy(strategy || settings.default_strategy)
    const side = await this.resolvePreferredSide(sponsorUserId, strat, manualSide)

    const node = await treeService.placeUser(sponsorUserId, side, newUserId)

    await supabase.from('network_positions').insert({
      user_id: newUserId,
      tree_node_id: node.id,
      sponsor_id: sponsorUserId,
      placement_parent_id: node.parent_id,
      placement_side: node.side,
      strategy: strat,
      placed_by: placedBy,
      is_override: isOverride,
    })

    try {
      const { networkEngineService } = await import('./networkEngine.service.js')
      await networkEngineService.syncFromTree(newUserId, { strategy: strat })
      await networkEngineService.recordActivity({
        eventType: 'member_placed',
        actorId: sponsorUserId,
        targetUserId: newUserId,
        agencyId,
        title: 'عضو جديد في الشبكة',
        body: `تم وضع عضو في الجانب ${node.side === 'LEFT' ? 'الأيسر' : 'الأيمن'}`,
        severity: 'success',
        payload: { tree_node_id: node.id, side: node.side, strategy: strat },
      })
    } catch (e) {
      console.warn('[placement] network sync', e.message)
    }

    return { node, strategy: strat, side: node.side }
  },

  async simulatePlacement({ sponsorUserId, strategy, manualSide, agencyId }) {
    const preview = await this.previewPlacement({ sponsorUserId, strategy, manualSide, agencyId })
    return { ...preview, simulated: true, message: 'معاينة فقط — لم يتم التنفيذ' }
  },
}
