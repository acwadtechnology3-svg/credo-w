import bcrypt from 'bcrypt'
import { supabase } from '../lib/supabase.js'
import { resolveAvatarDisplayUrl } from '../lib/avatarUrl.js'
import { treeService } from '../services/tree.service.js'
import { walletService } from '../services/wallet.service.js'
import { notifyUser } from '../lib/notify.js'
import { pearlsService } from '../services/pearls.service.js'

function isInNetwork(targetPath, myNodeId) {
  if (!targetPath || !myNodeId) return false
  return targetPath === myNodeId || targetPath.includes(myNodeId)
}

async function assertNetworkAccess(actorUserId, targetUserId) {
  if (actorUserId === targetUserId) return { isSelf: true }

  const { data: myNode } = await supabase
    .from('tree_nodes')
    .select('id')
    .eq('user_id', actorUserId)
    .maybeSingle()

  const { data: targetNode } = await supabase
    .from('tree_nodes')
    .select('path')
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (!myNode || !targetNode || !isInNetwork(targetNode.path, myNode.id)) {
    return null
  }
  return { isSelf: false }
}

async function generateUserCode() {
  const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true })
  if (error) throw error
  return `USR-${String((count || 0) + 1).padStart(6, '0')}`
}

async function mapNodeToTree(nodeId, depth = 0) {
  if (depth > 4) return null

  const { data: node } = await supabase
    .from('tree_nodes')
    .select('id, side, user_id, users!inner(username, user_code, status, profile_image, ranks(name))')
    .eq('id', nodeId)
    .single()

  if (!node) return null

  const { data: children } = await supabase
    .from('tree_nodes')
    .select('id, side')
    .eq('parent_id', nodeId)

  const leftChild = children?.find((c) => c.side === 'LEFT')
  const rightChild = children?.find((c) => c.side === 'RIGHT')

  return {
    id: nodeId,
    user_id: node.user_id,
    username: node.users?.username,
    user_code: node.users?.user_code,
    status: node.users?.status,
    rank: node.users?.ranks?.name,
    side: node.side,
    left: leftChild ? await mapNodeToTree(leftChild.id, depth + 1) : null,
    right: rightChild ? await mapNodeToTree(rightChild.id, depth + 1) : null,
  }
}

export const teamController = {
  async checkReferralAvailability(req, res) {
    try {
      const username = (req.query.username || '').trim()
      const email = (req.query.email || '').trim().toLowerCase()
      const national_id = (req.query.national_id || '').trim()

      const result = { username: null, email: null, national_id: null }

      if (username.length >= 2) {
        const { data } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
        result.username = !data
      }
      if (email.includes('@')) {
        const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
        result.email = !data
      }
      if (national_id.length >= 6) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('national_id', national_id)
          .maybeSingle()
        result.national_id = !data
      }

      return res.json(result)
    } catch (err) {
      console.error('checkReferralAvailability:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async createReferral(req, res) {
    try {
      const sponsorId = req.user.userId
      const {
        side,
        username,
        email,
        password,
        full_name,
        title,
        national_id,
        phone,
        country,
      } = req.body

      if (!username || !email || !password || !full_name || !national_id) {
        return res.status(400).json({ error: 'All required fields must be provided' })
      }

      const { data: sponsor } = await supabase
        .from('users')
        .select('user_code, status')
        .eq('id', sponsorId)
        .single()

      if (!sponsor || sponsor.status !== 'active') {
        return res.status(403).json({ error: 'Your account must be active to add referrals' })
      }

      const { data: dupUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle()
      const { data: dupEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      const { data: dupNid } = await supabase
        .from('users')
        .select('id')
        .eq('national_id', national_id)
        .maybeSingle()

      if (dupUser || dupEmail || dupNid) {
        return res.status(409).json({ error: 'Username, email or National ID already exists' })
      }

      const password_hash = await bcrypt.hash(password, 10)
      const user_code = await generateUserCode()

      const { data: bapRank } = await supabase.from('ranks').select('id').eq('name', 'BAP').single()

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          user_code,
          username,
          email,
          password_hash,
          full_name,
          title: title || 'Mr',
          national_id,
          phone,
          country: country || 'Egypt',
          sponsor_id: sponsorId,
          rank_id: bapRank?.id,
          role: 'ambassador',
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      const { treeActivationService } = await import('../services/treeActivation.service.js')
      await treeActivationService.queuePendingPlacement({
        userId: newUser.id,
        sponsorId,
        placementSide: side || 'AUTO',
        source: 'referral',
      })
      await walletService.createUserWallets(newUser.id)

      try {
        await pearlsService.onReferralJoined(sponsorId, newUser.id)
        const { progressionEngine } = await import('../services/progressionEngine.service.js')
        await progressionEngine.onReferralJoin(sponsorId, newUser.id)
      } catch (pearlErr) {
        console.warn('Pearls referral:', pearlErr.message)
      }

      return res.status(201).json({
        message: 'Referral created. Pending activation.',
        user_code: newUser.user_code,
      })
    } catch (err) {
      console.error('createReferral:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getReferrals(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1)
      const limit = Math.min(100, parseInt(req.query.limit, 10) || 50)
      const { search, from, to } = req.query
      const offset = (page - 1) * limit

      let query = supabase
        .from('users')
        .select('id, user_code, username, full_name, email, status, country, created_at, active_date, ranks(name)', {
          count: 'exact',
        })
        .eq('sponsor_id', req.user.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) query = query.ilike('username', `%${search}%`)
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data, count, error } = await query
      if (error) throw error

      const withSide = await Promise.all(
        (data || []).map(async (u) => {
          const { data: node } = await supabase
            .from('tree_nodes')
            .select('side')
            .eq('user_id', u.id)
            .maybeSingle()
          return { ...u, side: node?.side || 'N/A', rank: u.ranks?.name || 'BAP' }
        })
      )

      return res.json({ data: withSide, total: count ?? 0, page, limit })
    } catch (err) {
      console.error('getReferrals:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getGenealogy(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1)
      const limit = Math.min(100, parseInt(req.query.limit, 10) || 50)
      const { side, status, search } = req.query
      const offset = (page - 1) * limit

      const { data: myNode } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('user_id', req.user.userId)
        .maybeSingle()

      if (!myNode) return res.json({ data: [], total: 0, page, limit })

      let query = supabase
        .from('tree_nodes')
        .select(
          'side, depth_level, users!inner(id, username, country, created_at, active_date, status, ranks(name))',
          { count: 'exact' }
        )
        .like('path', `%${myNode.id}%`)
        .neq('user_id', req.user.userId)
        .order('depth_level')
        .range(offset, offset + limit - 1)

      if (side) query = query.eq('side', side.toUpperCase())

      const { data, count, error } = await query
      if (error) throw error

      let result = (data || []).map((n) => ({
        username: n.users?.username,
        country: n.users?.country,
        joining_date: n.users?.created_at,
        activation_date: n.users?.active_date,
        status: n.users?.status,
        side: n.side,
        placement_level: n.depth_level,
        rank: n.users?.ranks?.name || 'BAP',
      }))

      if (status) {
        result = result.filter((r) => r.status === status)
      }
      if (search) {
        const q = search.toLowerCase()
        result = result.filter((r) => r.username?.toLowerCase().includes(q))
      }

      return res.json({
        data: result,
        total: search || status ? result.length : count ?? 0,
        page,
        limit,
      })
    } catch (err) {
      console.error('getGenealogy:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getTeamMember(req, res) {
    try {
      const targetUserId = req.params.userId
      const actorUserId = req.user.userId

      const access = await assertNetworkAccess(actorUserId, targetUserId)
      if (!access) {
        return res.status(403).json({ error: 'Member is not in your network' })
      }

      const { data: member, error } = await supabase
        .from('users')
        .select(
          'id, user_code, username, full_name, email, phone, country, status, profile_image, created_at, active_date, total_pv, direct_count, sponsor_id, ranks(name)'
        )
        .eq('id', targetUserId)
        .single()

      if (error || !member) {
        return res.status(404).json({ error: 'Member not found' })
      }

      const { data: treeNode } = await supabase
        .from('tree_nodes')
        .select('side, depth_level')
        .eq('user_id', targetUserId)
        .maybeSingle()

      let sponsorUsername = null
      if (member.sponsor_id) {
        const { data: sponsor } = await supabase
          .from('users')
          .select('username')
          .eq('id', member.sponsor_id)
          .maybeSingle()
        sponsorUsername = sponsor?.username || null
      }

      const { data: actor } = await supabase
        .from('users')
        .select('username')
        .eq('id', actorUserId)
        .maybeSingle()

      const profile_image = member.profile_image
        ? await resolveAvatarDisplayUrl(member.profile_image)
        : null

      return res.json({
        member: {
          id: member.id,
          user_code: member.user_code,
          username: member.username,
          full_name: member.full_name,
          email: member.email,
          phone: member.phone,
          country: member.country,
          status: member.status,
          profile_image,
          rank: member.ranks?.name || 'BAP',
          created_at: member.created_at,
          active_date: member.active_date,
          total_pv: member.total_pv,
          direct_count: member.direct_count,
          sponsor_username: sponsorUsername,
          tree_side: treeNode?.side || null,
          tree_depth: treeNode?.depth_level ?? null,
        },
        is_self: access.isSelf,
        can_notify: !access.isSelf,
        sender_username: actor?.username || null,
      })
    } catch (err) {
      console.error('getTeamMember:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async notifyTeamMember(req, res) {
    try {
      const targetUserId = req.params.userId
      const actorUserId = req.user.userId
      const { title, body } = req.body

      if (!title?.trim() || !body?.trim()) {
        return res.status(400).json({ error: 'Title and message are required' })
      }

      const access = await assertNetworkAccess(actorUserId, targetUserId)
      if (!access) {
        return res.status(403).json({ error: 'Member is not in your network' })
      }
      if (access.isSelf) {
        return res.status(400).json({ error: 'Cannot send a notification to yourself' })
      }

      const { data: actor } = await supabase
        .from('users')
        .select('username')
        .eq('id', actorUserId)
        .maybeSingle()

      const notifTitle = title.trim().slice(0, 120)
      const notifBody = body.trim().slice(0, 500)

      await notifyUser(targetUserId, {
        type: 'team_message',
        title: notifTitle,
        body: notifBody,
        senderId: actorUserId,
      })

      await supabase.from('audit_logs').insert({
        actor_id: actorUserId,
        action: 'TEAM_NOTIFY',
        entity: 'users',
        entity_id: targetUserId,
        new_value: { title: notifTitle, from: actor?.username },
      })

      return res.json({ message: 'Notification sent' })
    } catch (err) {
      console.error('notifyTeamMember:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getPlacementTree(req, res) {
    try {
      const { treeAccessService } = await import('../services/treeAccess.service.js')
      const ctx = await treeAccessService.getUserTreeContext(req.user.userId)
      if (!ctx.canViewLiveTree) {
        return res.json({
          tree: null,
          gated: true,
          lockedReason: ctx.lockedReason,
          hasActivePackage: ctx.hasActivePackage,
          needsOnboarding: ctx.needsOnboarding,
        })
      }

      const { data: myNode } = await supabase
        .from('tree_nodes')
        .select('id')
        .eq('user_id', req.user.userId)
        .maybeSingle()

      if (!myNode) return res.json({ tree: null, gated: false })

      const tree = await mapNodeToTree(myNode.id)
      return res.json({ tree, gated: false })
    } catch (err) {
      console.error('getPlacementTree:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getBusinessVolume(req, res) {
    try {
      const { from, to, side } = req.query

      let query = supabase
        .from('bv_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })

      if (side) query = query.eq('side', side.toUpperCase())
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data, count, error } = await query
      if (error) throw error

      const logs = await Promise.all(
        (data || []).map(async (log) => {
          let sourceUsername = null
          if (log.source_user_id) {
            const { data: src } = await supabase
              .from('users')
              .select('username')
              .eq('id', log.source_user_id)
              .maybeSingle()
            sourceUsername = src?.username
          }
          return { ...log, source: { username: sourceUsername } }
        })
      )

      const sideA =
        logs.filter((b) => b.side === 'LEFT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0
      const sideB =
        logs.filter((b) => b.side === 'RIGHT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0

      return res.json({
        sideA,
        sideB,
        businessToCycle: Math.min(sideA, sideB),
        logs,
        total: count ?? logs.length,
      })
    } catch (err) {
      console.error('getBusinessVolume:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getPersonalVolume(req, res) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('total_pv')
        .eq('id', req.user.userId)
        .single()

      const { data: logs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', req.user.userId)
        .in('category', ['PURCHASE', 'ADJUSTMENT'])
        .order('created_at', { ascending: false })

      return res.json({ total_pv: user?.total_pv || 0, logs: logs || [] })
    } catch (err) {
      console.error('getPersonalVolume:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
