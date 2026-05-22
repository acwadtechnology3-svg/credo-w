import { supabase } from '../lib/supabase.js'

export const treeService = {
  async placeUser(sponsorId, preferredSide, newUserId) {
    const { data: sponsorNode, error: sponsorErr } = await supabase
      .from('tree_nodes')
      .select('*')
      .eq('user_id', sponsorId)
      .single()

    if (sponsorErr || !sponsorNode) throw new Error('Sponsor tree node not found')

    const pref = preferredSide?.toUpperCase()
    let side = pref === 'RIGHT' ? 'RIGHT' : 'LEFT'
    if (pref === 'AUTO') {
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
      if (!leftChild) side = 'LEFT'
      else if (!rightChild) side = 'RIGHT'
    }

    let parentNode = sponsorNode
    let placementSide = side

    const { data: existingChild } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('parent_id', sponsorNode.id)
      .eq('side', side)
      .maybeSingle()

    if (existingChild) {
      const otherSide = side === 'LEFT' ? 'RIGHT' : 'LEFT'
      const { data: otherChild } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('parent_id', sponsorNode.id)
        .eq('side', otherSide)
        .maybeSingle()

      if (!otherChild) {
        placementSide = otherSide
      } else {
        const result = await this.bfsFind(sponsorNode.id, side)
        parentNode = result.parentNode
        placementSide = result.side
      }
    }

    const newPath = parentNode.path
      ? `${parentNode.path}/${parentNode.id}`
      : `/${parentNode.id}`

    const { data: newNode, error } = await supabase
      .from('tree_nodes')
      .insert({
        user_id: newUserId,
        parent_id: parentNode.id,
        side: placementSide,
        depth_level: parentNode.depth_level + 1,
        path: newPath,
      })
      .select()
      .single()

    if (error) throw error
    return newNode
  },

  async bfsFind(rootNodeId, preferredSide) {
    const queue = [rootNodeId]
    while (queue.length > 0) {
      const currentId = queue.shift()
      const { data: currentNode } = await supabase
        .from('tree_nodes')
        .select('*')
        .eq('id', currentId)
        .single()

      const sides = [preferredSide, preferredSide === 'LEFT' ? 'RIGHT' : 'LEFT']
      for (const side of sides) {
        const { data: child } = await supabase
          .from('tree_nodes')
          .select('id')
          .eq('parent_id', currentId)
          .eq('side', side)
          .maybeSingle()
        if (!child) return { parentNode: currentNode, side }
        queue.push(child.id)
      }
    }
    throw new Error('No available slot found')
  },

  async placeRoot(newUserId) {
    const { data, error } = await supabase
      .from('tree_nodes')
      .insert({
        user_id: newUserId,
        parent_id: null,
        side: null,
        depth_level: 0,
        path: '',
      })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
