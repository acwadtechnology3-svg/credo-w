import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'

export const bvService = {
  async creditBV(buyerUserId, bvAmount, orderId) {
    const bv = roundMoney(bvAmount)
    if (bv <= 0) return

    const { data: buyerNode } = await supabase
      .from('tree_nodes')
      .select('parent_id, side, path')
      .eq('user_id', buyerUserId)
      .single()

    if (!buyerNode) return

    await supabase.from('bv_logs').insert({
      user_id: buyerUserId,
      side: buyerNode.side || 'LEFT',
      amount: bv,
      source_user_id: buyerUserId,
      order_id: orderId,
      note: 'Personal purchase',
    })

    const { data: buyer } = await supabase
      .from('users')
      .select('total_pv')
      .eq('id', buyerUserId)
      .single()

    if (buyer) {
      await supabase
        .from('users')
        .update({ total_pv: roundMoney(parseFloat(buyer.total_pv) + bv) })
        .eq('id', buyerUserId)
    }

    if (!buyerNode.path) return

    const pathParts = buyerNode.path.split('/').filter(Boolean)

    for (const nodeId of pathParts) {
      const { data: ancestorNode } = await supabase
        .from('tree_nodes')
        .select('user_id, side')
        .eq('id', nodeId)
        .single()

      if (!ancestorNode) continue

      const ancestorIndex = pathParts.indexOf(nodeId)
      const nextNodeId = pathParts[ancestorIndex + 1]

      let side = 'LEFT'
      if (nextNodeId) {
        const { data: nextNode } = await supabase
          .from('tree_nodes')
          .select('side')
          .eq('id', nextNodeId)
          .single()
        side = nextNode?.side || 'LEFT'
      }

      await supabase.from('bv_logs').insert({
        user_id: ancestorNode.user_id,
        side,
        amount: bv,
        source_user_id: buyerUserId,
        order_id: orderId,
        note: 'From downline purchase',
      })
    }
  },

  async getUserBVTotals(userId) {
    const { data } = await supabase
      .from('bv_logs')
      .select('side, amount')
      .eq('user_id', userId)

    const sideA =
      data?.filter((b) => b.side === 'LEFT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0
    const sideB =
      data?.filter((b) => b.side === 'RIGHT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0

    return { sideA, sideB, weaker: Math.min(sideA, sideB) }
  },
}
