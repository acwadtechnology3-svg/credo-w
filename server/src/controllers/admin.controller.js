import { supabase } from '../lib/supabase.js'
import { walletService } from '../services/wallet.service.js'
import { commissionService } from '../services/commission.service.js'

function sanitizeSearch(term) {
  return String(term).replace(/[%_,.()]/g, '').trim()
}

const SUPER_ADMIN_ONLY_KEYS = new Set([
  'weekly_commission_cap_egp',
  'monthly_commission_cap_egp',
  'weekly_withdrawal_cap_egp',
  'monthly_withdrawal_cap_egp',
  'min_deposit_egp',
  'pin_lock_attempts',
  'pin_lock_minutes',
  'commission_run_schedule',
  'maintenance_mode',
  'maintenance_message',
  'usd_to_egp_rate',
  'fast_start_milestone_1',
  'fast_start_milestone_2',
  'fast_start_milestone_3',
  'level_bonus_l1_pct',
  'level_bonus_l2_pct',
  'level_bonus_l3_pct',
  'level_bonus_l4_pct',
  'level_bonus_l5_pct',
])

export const adminController = {
  async getOverview(req, res) {
    try {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: pendingUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      const { data: revenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'delivered')
      const totalRevenue = (revenueData || []).reduce((s, o) => s + parseFloat(o.total), 0)

      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'requested')

      const { data: lastCycle } = await supabase
        .from('commission_cycles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return res.json({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        pendingUsers: pendingUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue: Math.round(totalRevenue),
        pendingWithdrawals: pendingWithdrawals || 0,
        lastCycle: lastCycle || null,
      })
    } catch (err) {
      console.error('getOverview error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status, role } = req.query
      const offset = (page - 1) * limit

      let query = supabase
        .from('users')
        .select(
          'id, user_code, username, full_name, email, role, status, country, created_at, active_date, total_pv, direct_count, ranks(name)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1)

      const q = sanitizeSearch(search)
      if (q) {
        query = query.or(
          `username.ilike.%${q}%,email.ilike.%${q}%,full_name.ilike.%${q}%,user_code.ilike.%${q}%`
        )
      }
      if (status) query = query.eq('status', status)
      if (role) query = query.eq('role', role)

      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count, page: parseInt(page) })
    } catch (err) {
      console.error('getUsers error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getUser(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*, ranks(*), tree_nodes(parent_id, side, depth_level)')
        .eq('id', req.params.id)
        .single()

      if (error || !user) return res.status(404).json({ error: 'User not found' })

      const { data: wallets } = await supabase
        .from('wallets')
        .select('type, balance')
        .eq('user_id', req.params.id)

      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_ref, total, status, created_at')
        .eq('user_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { password_hash, cmoney_pin_hash, ...safeUser } = user
      return res.json({ user: safeUser, wallets, recentOrders: orders })
    } catch (err) {
      console.error('getUser error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateUserStatus(req, res) {
    try {
      const { status } = req.body
      const validStatuses = ['active', 'pending', 'suspended']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }

      const updateData = { status }
      if (status === 'active') updateData.active_date = new Date().toISOString()

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error

      if (status === 'active') {
        try {
          const { invitationService } = await import('../services/invitation.service.js')
          await invitationService.onUserJoinedTeam(req.params.id)
        } catch (invErr) {
          console.warn('Invitation join tracking:', invErr.message)
        }
      }

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_USER_STATUS',
        entity: 'users',
        entity_id: req.params.id,
        new_value: { status },
        ip_address: req.ip,
      })

      return res.json({ message: `User ${status}`, user: data })
    } catch (err) {
      console.error('updateUserStatus error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateUserRole(req, res) {
    try {
      const { role } = req.body
      const validRoles = ['ambassador', 'franchise', 'admin']
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }

      await supabase.from('users').update({ role }).eq('id', req.params.id)

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_USER_ROLE',
        entity: 'users',
        entity_id: req.params.id,
        new_value: { role },
        ip_address: req.ip,
      })

      return res.json({ message: `Role updated to ${role}` })
    } catch (err) {
      console.error('updateUserRole error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async grantBonus(req, res) {
    try {
      const { amount, wallet_type, description } = req.body
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' })
      }

      const wType = wallet_type || 'EARNINGS'
      if (!['EARNINGS', 'CMONEY', 'PEARLS'].includes(wType)) {
        return res.status(400).json({ error: 'Invalid wallet type' })
      }

      await walletService.credit(
        req.params.id,
        wType,
        parseFloat(amount),
        'ADJUSTMENT',
        description || 'Manual bonus by admin'
      )

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'GRANT_BONUS',
        entity: 'users',
        entity_id: req.params.id,
        new_value: { amount, wallet_type: wType, description },
        ip_address: req.ip,
      })

      await supabase.from('notifications').insert({
        user_id: req.params.id,
        type: 'ADJUSTMENT',
        title: 'Bonus credited',
        body: `EGP ${amount} ${description || 'manual bonus'} added to your ${wType} wallet`,
      })

      return res.json({ message: `EGP ${amount} granted successfully` })
    } catch (err) {
      console.error('grantBonus error:', err)
      if (err.code === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'Insufficient balance' })
      }
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getWithdrawals(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query
      const offset = (page - 1) * limit

      let query = supabase
        .from('withdrawals')
        .select('*, users(username, full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1)

      if (status) query = query.eq('status', status)

      const { data, count, error } = await query
      if (error) throw error

      const bankIds = [...new Set((data || []).map((w) => w.bank_account_id).filter(Boolean))]
      let banksById = {}
      if (bankIds.length) {
        const { data: banks } = await supabase
          .from('bank_accounts')
          .select('id, account_name, bank_name, account_number')
          .in('id', bankIds)
        banksById = Object.fromEntries((banks || []).map((b) => [b.id, b]))
      }

      const enriched = (data || []).map((w) => ({
        ...w,
        bank_accounts: w.bank_account_id ? banksById[w.bank_account_id] || null : null,
      }))

      return res.json({ data: enriched, total: count })
    } catch (err) {
      console.error('getWithdrawals error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async processWithdrawal(req, res) {
    try {
      const { action, admin_note } = req.body
      if (!['paid', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Action must be paid or rejected' })
      }

      const { data: withdrawal } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', req.params.id)
        .single()
      if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' })
      if (!['requested', 'processing'].includes(withdrawal.status)) {
        return res.status(400).json({ error: 'Withdrawal already processed' })
      }

      const updateData = { status: action, admin_note }
      if (action === 'paid') updateData.paid_at = new Date().toISOString()

      if (action === 'rejected') {
        await walletService.credit(
          withdrawal.user_id,
          'EARNINGS',
          parseFloat(withdrawal.amount),
          'REFUND',
          'Withdrawal rejected — refunded'
        )
      }

      await supabase.from('withdrawals').update(updateData).eq('id', req.params.id)

      await supabase.from('notifications').insert({
        user_id: withdrawal.user_id,
        type: 'WITHDRAWAL',
        title: action === 'paid' ? 'Withdrawal processed' : 'Withdrawal rejected',
        body:
          action === 'paid'
            ? `EGP ${withdrawal.payable_amount} has been sent to your bank account`
            : `Your withdrawal of EGP ${withdrawal.amount} was rejected. ${admin_note || ''}`,
      })

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: `WITHDRAWAL_${action.toUpperCase()}`,
        entity: 'withdrawals',
        entity_id: req.params.id,
        new_value: { action, admin_note },
        ip_address: req.ip,
      })

      return res.json({ message: `Withdrawal ${action}` })
    } catch (err) {
      console.error('processWithdrawal error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getProducts(req, res) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getProducts error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createProduct(req, res) {
    try {
      const { name, description, price_egp, tax_rate, bv_points, pv_points, category, is_package, stock } =
        req.body
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          price_egp,
          tax_rate: tax_rate || 14,
          bv_points: bv_points || 0,
          pv_points: pv_points || 0,
          category: category || 'ALL',
          is_package: !!is_package,
          stock: stock ?? -1,
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('createProduct error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateProduct(req, res) {
    try {
      const allowed = [
        'name',
        'description',
        'price_egp',
        'tax_rate',
        'bv_points',
        'pv_points',
        'category',
        'is_package',
        'stock',
        'is_active',
        'image_url',
      ]
      const patch = {}
      for (const k of allowed) {
        if (req.body[k] !== undefined) patch[k] = req.body[k]
      }
      const { data, error } = await supabase
        .from('products')
        .update(patch)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('updateProduct error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteProduct(req, res) {
    try {
      await supabase.from('products').update({ is_active: false }).eq('id', req.params.id)
      return res.json({ message: 'Product deactivated' })
    } catch (err) {
      console.error('deleteProduct error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async runCommission(req, res) {
    try {
      const result = await commissionService.runWeeklyCycle()
      return res.json({ message: 'Commission cycle completed', ...result })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  },

  async getCommissionCycles(req, res) {
    try {
      const { data } = await supabase
        .from('commission_cycles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      return res.json(data || [])
    } catch (err) {
      console.error('getCommissionCycles error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getCycleDetails(req, res) {
    try {
      const { data } = await supabase
        .from('team_commissions')
        .select('*, users(username, full_name, ranks(name))')
        .eq('cycle_id', req.params.id)
        .order('commission_amount', { ascending: false })
        .limit(100)
      return res.json(data || [])
    } catch (err) {
      console.error('getCycleDetails error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getSettings(req, res) {
    try {
      const { data } = await supabase.from('system_settings').select('*').order('key')
      const filtered = (data || []).filter((s) => !SUPER_ADMIN_ONLY_KEYS.has(s.key))
      return res.json(filtered)
    } catch (err) {
      console.error('getSettings error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateSetting(req, res) {
    try {
      if (SUPER_ADMIN_ONLY_KEYS.has(req.params.key)) {
        return res.status(403).json({ error: 'This setting requires Super Admin access' })
      }
      const { value } = req.body
      const { data, error } = await supabase
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', req.params.key)
        .select()
        .single()
      if (error) throw error

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_SETTING',
        entity: 'system_settings',
        entity_id: null,
        new_value: { key: req.params.key, value },
        ip_address: req.ip,
      })

      return res.json(data)
    } catch (err) {
      console.error('updateSetting error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getAuditLogs(req, res) {
    try {
      const { page = 1, limit = 50, action, entity } = req.query
      const offset = (page - 1) * limit

      let query = supabase
        .from('audit_logs')
        .select('*, actor:actor_id(username)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1)

      if (action) query = query.eq('action', action)
      if (entity) query = query.eq('entity', entity)

      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('getAuditLogs error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async generateVouchers(req, res) {
    try {
      const { user_id, count = 1, discount_amount, expires_days = 365 } = req.body
      if (!user_id || !discount_amount) {
        return res.status(400).json({ error: 'user_id and discount_amount required' })
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(expires_days))

      const vouchers = Array.from({ length: parseInt(count) }, () => ({
        user_id,
        discount_amount: parseFloat(discount_amount),
        expires_at: expiresAt.toISOString(),
        status: 'available',
      }))

      const { data, error } = await supabase.from('vouchers').insert(vouchers).select()
      if (error) throw error
      return res.status(201).json({ message: `${count} vouchers generated`, vouchers: data })
    } catch (err) {
      console.error('generateVouchers error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getVouchers(req, res) {
    try {
      const { status, user_id, page = 1, limit = 50 } = req.query
      const offset = (page - 1) * limit
      let query = supabase
        .from('vouchers')
        .select(
          '*, users:users!vouchers_user_id_fkey(username), redeemed:users!vouchers_redeemed_by_fkey(username)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1)

      if (status) query = query.eq('status', status)
      if (user_id) query = query.eq('user_id', user_id)

      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('getVouchers error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async banUser(req, res) {
    try {
      const { ban_type, ban_reason, ban_scope, ban_duration_days } = req.body
      const targetId = req.params.id

      if (!ban_reason || ban_reason.trim().length < 5) {
        return res.status(400).json({ error: 'Ban reason is required (min 5 characters)' })
      }
      if (!['temporary', 'permanent'].includes(ban_type)) {
        return res.status(400).json({ error: 'ban_type must be temporary or permanent' })
      }
      if (ban_type === 'temporary' && !ban_duration_days) {
        return res.status(400).json({ error: 'ban_duration_days required for temporary ban' })
      }

      const { data: target } = await supabase
        .from('users')
        .select('role, username')
        .eq('id', targetId)
        .single()
      if (!target) return res.status(404).json({ error: 'User not found' })
      if (['admin', 'super_admin'].includes(target.role)) {
        return res.status(403).json({ error: 'Cannot ban admin users' })
      }

      const banExpiresAt =
        ban_type === 'temporary'
          ? new Date(Date.now() + parseInt(ban_duration_days, 10) * 24 * 60 * 60 * 1000)
          : null

      const banScopeArr = Array.isArray(ban_scope) ? ban_scope : ban_scope ? [ban_scope] : ['all']
      const isFullBan = banScopeArr.includes('all') || banScopeArr.length === 0

      await supabase
        .from('users')
        .update({
          status: isFullBan ? 'suspended' : 'active',
          ban_type,
          ban_reason,
          ban_scope: banScopeArr,
          ban_expires_at: banExpiresAt?.toISOString() || null,
          banned_by: req.user.userId,
          banned_at: new Date().toISOString(),
        })
        .eq('id', targetId)

      const notifTitle =
        ban_type === 'permanent'
          ? 'Account permanently suspended'
          : 'Account temporarily suspended'
      const notifBody =
        ban_type === 'permanent'
          ? `Your account has been suspended. Reason: ${ban_reason}`
          : `Your account has been suspended until ${banExpiresAt?.toLocaleDateString()}. Reason: ${ban_reason}`

      await supabase.from('notifications').insert({
        user_id: targetId,
        type: 'BAN',
        title: notifTitle,
        body: notifBody,
      })

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'BAN_USER',
        entity: 'users',
        entity_id: targetId,
        new_value: { ban_type, ban_reason, ban_scope: banScopeArr, ban_duration_days },
        ip_address: req.ip,
      })

      return res.json({
        message: `User ${target.username} has been ${ban_type === 'permanent' ? 'permanently' : 'temporarily'} banned`,
      })
    } catch (err) {
      console.error('banUser error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async unbanUser(req, res) {
    try {
      const { reason } = req.body
      const targetId = req.params.id

      const { data: target } = await supabase
        .from('users')
        .select('username, ban_type')
        .eq('id', targetId)
        .single()
      if (!target) return res.status(404).json({ error: 'User not found' })

      await supabase
        .from('users')
        .update({
          status: 'active',
          ban_type: null,
          ban_reason: null,
          ban_scope: null,
          ban_expires_at: null,
          banned_by: null,
          banned_at: null,
        })
        .eq('id', targetId)

      await supabase.from('notifications').insert({
        user_id: targetId,
        type: 'UNBAN',
        title: 'Account reactivated',
        body: 'Your account has been reactivated. You can now access all features.',
      })

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UNBAN_USER',
        entity: 'users',
        entity_id: targetId,
        new_value: { reason },
        ip_address: req.ip,
      })

      return res.json({ message: `User ${target.username} has been unbanned` })
    } catch (err) {
      console.error('unbanUser error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getUserDetails(req, res) {
    try {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('*, ranks(*), tree_nodes(parent_id, side, depth_level, path)')
        .eq('id', req.params.id)
        .single()
      if (userErr || !user) return res.status(404).json({ error: 'User not found' })

      const sponsorPromise = user.sponsor_id
        ? supabase
            .from('users')
            .select('id, username, full_name, user_code')
            .eq('id', user.sponsor_id)
            .maybeSingle()
        : Promise.resolve({ data: null })

      const [
        { data: wallets },
        { data: recentOrders },
        { data: recentTransactions },
        { data: commissions },
        { data: bvData },
        { data: referrals, count: referralCount },
        { data: kycDoc },
        { data: banHistory },
        { data: sponsor },
      ] = await Promise.all([
        supabase.from('wallets').select('type, balance').eq('user_id', req.params.id),
        supabase
          .from('orders')
          .select('id, order_ref, total, status, created_at, payment_method')
          .eq('user_id', req.params.id)
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', req.params.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('team_commissions')
          .select('commission_amount, commission_pct, created_at, rank_at_time, pay_leg_volume')
          .eq('user_id', req.params.id)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase.from('bv_logs').select('side, amount, note, created_at').eq('user_id', req.params.id),
        supabase
          .from('users')
          .select('id, username, full_name, status, created_at, total_pv, ranks(name)', { count: 'exact' })
          .eq('sponsor_id', req.params.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('kyc_documents')
          .select('*')
          .eq('user_id', req.params.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('audit_logs')
          .select('action, created_at, new_value')
          .eq('entity_id', req.params.id)
          .order('created_at', { ascending: false })
          .limit(20),
        sponsorPromise,
      ])

      const sideA = (bvData || [])
        .filter((b) => b.side === 'LEFT')
        .reduce((s, b) => s + parseFloat(b.amount), 0)
      const sideB = (bvData || [])
        .filter((b) => b.side === 'RIGHT')
        .reduce((s, b) => s + parseFloat(b.amount), 0)
      const totalCommission = (commissions || []).reduce(
        (s, c) => s + parseFloat(c.commission_amount || 0),
        0
      )

      const { password_hash, cmoney_pin_hash, ...safeUser } = user
      const treeNode = Array.isArray(user.tree_nodes) ? user.tree_nodes[0] : user.tree_nodes

      return res.json({
        user: { ...safeUser, tree_nodes: treeNode || null },
        sponsor: sponsor || null,
        wallets,
        recentOrders,
        recentTransactions,
        commissions: commissions || [],
        bv: { sideA, sideB },
        totalCommission: Math.round(totalCommission),
        referrals: referrals || [],
        referralCount: referralCount || 0,
        kycDoc: kycDoc || null,
        banHistory: banHistory || [],
      })
    } catch (err) {
      console.error('getUserDetails error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getDeposits(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query
      const offset = (page - 1) * limit
      let query = supabase
        .from('deposit_requests')
        .select('*, users(username, full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)
      if (status) query = query.eq('status', status)
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count || 0 })
    } catch (err) {
      console.error('getDeposits error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async processDeposit(req, res) {
    try {
      const { action, admin_note } = req.body
      if (!['confirmed', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Action must be confirmed or rejected' })
      }

      const { data: deposit } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('id', req.params.id)
        .single()
      if (!deposit) return res.status(404).json({ error: 'Deposit not found' })
      if (deposit.status !== 'pending') {
        return res.status(400).json({ error: 'Deposit already processed' })
      }

      await supabase
        .from('deposit_requests')
        .update({
          status: action,
          admin_note,
          confirmed_by: req.user.userId,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)

      if (action === 'confirmed') {
        await walletService.credit(
          deposit.user_id,
          'CMONEY',
          parseFloat(deposit.amount),
          'DEPOSIT',
          `Deposit confirmed — ${deposit.payment_method}`
        )
        await supabase.from('notifications').insert({
          user_id: deposit.user_id,
          type: 'DEPOSIT',
          title: 'Deposit confirmed',
          body: `Your deposit of EGP ${deposit.amount} has been confirmed and added to your C Money wallet.`,
        })
      } else {
        await supabase.from('notifications').insert({
          user_id: deposit.user_id,
          type: 'DEPOSIT',
          title: 'Deposit rejected',
          body: `Your deposit of EGP ${deposit.amount} was rejected.${admin_note ? ` Reason: ${admin_note}` : ''}`,
        })
      }

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: action === 'confirmed' ? 'DEPOSIT_CONFIRMED' : 'DEPOSIT_REJECTED',
        entity: 'deposit_requests',
        entity_id: req.params.id,
        new_value: { action, amount: deposit.amount, admin_note },
        ip_address: req.ip,
      })

      return res.json({ message: `Deposit ${action}` })
    } catch (err) {
      console.error('processDeposit error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getKycRequests(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query
      const offset = (page - 1) * limit
      let query = supabase
        .from('kyc_documents')
        .select('*, users(username, full_name, email, national_id)', { count: 'exact' })
        .order('submitted_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)
      if (status) query = query.eq('status', status)
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count || 0 })
    } catch (err) {
      console.error('getKycRequests error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async processKyc(req, res) {
    try {
      const { action, rejection_reason } = req.body
      if (!['verified', 'rejected', 'under_review'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' })
      }
      if (action === 'rejected' && !rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required' })
      }

      const { data: doc } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('id', req.params.id)
        .single()
      if (!doc) return res.status(404).json({ error: 'KYC document not found' })

      await supabase
        .from('kyc_documents')
        .update({
          status: action,
          rejection_reason: rejection_reason || null,
          reviewed_by: req.user.userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)

      const kycUserStatus =
        action === 'verified' ? 'verified' : action === 'rejected' ? 'rejected' : 'under_review'
      await supabase.from('users').update({ kyc_status: kycUserStatus }).eq('id', doc.user_id)

      const notif =
        action === 'verified'
          ? {
              title: 'Identity verified ✓',
              body: 'Your identity has been verified. Your account is now fully verified.',
            }
          : action === 'rejected'
            ? {
                title: 'Identity verification failed',
                body: `Verification rejected. Reason: ${rejection_reason}. Please resubmit.`,
              }
            : {
                title: 'Under review',
                body: 'Your documents are being reviewed. We will notify you shortly.',
              }

      await supabase.from('notifications').insert({
        user_id: doc.user_id,
        type: 'KYC',
        ...notif,
      })

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: `KYC_${action.toUpperCase()}`,
        entity: 'kyc_documents',
        entity_id: req.params.id,
        new_value: { action, rejection_reason },
        ip_address: req.ip,
      })

      return res.json({ message: `KYC ${action}` })
    } catch (err) {
      console.error('processKyc error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getReports(req, res) {
    try {
      const { from, to } = req.query
      const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const toDate = to || new Date().toISOString()

      const [
        { data: orders },
        { data: commissions },
        { data: deposits },
        { data: withdrawals },
        { data: newUsers },
        { data: ordersWithItems },
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('total, status, created_at')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('wallet_transactions')
          .select('amount, created_at')
          .eq('category', 'TEAM_COMMISSION')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('deposit_requests')
          .select('amount, status, created_at')
          .eq('status', 'confirmed')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('withdrawals')
          .select('amount, status, created_at')
          .eq('status', 'paid')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('users')
          .select('created_at')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('orders')
          .select('order_items(quantity, unit_price, products(name))')
          .neq('status', 'cancelled')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
      ])

      const totalRevenue = (orders || [])
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + parseFloat(o.total || 0), 0)
      const totalCommission = (commissions || []).reduce(
        (s, t) => s + parseFloat(t.amount || 0),
        0
      )
      const totalDeposits = (deposits || []).reduce((s, d) => s + parseFloat(d.amount || 0), 0)
      const totalWithdrawals = (withdrawals || []).reduce(
        (s, w) => s + parseFloat(w.amount || 0),
        0
      )

      const revenueByDay = {}
      ;(orders || [])
        .filter((o) => o.status !== 'cancelled')
        .forEach((o) => {
          const day = o.created_at.split('T')[0]
          revenueByDay[day] = (revenueByDay[day] || 0) + parseFloat(o.total || 0)
        })

      const productMap = {}
      ;(ordersWithItems || []).forEach((order) => {
        ;(order.order_items || []).forEach((item) => {
          const name = item.products?.name || 'Unknown'
          if (!productMap[name]) productMap[name] = { name, quantity: 0, revenue: 0 }
          productMap[name].quantity += item.quantity
          productMap[name].revenue += item.quantity * parseFloat(item.unit_price || 0)
        })
      })
      const topProductsList = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      return res.json({
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalCommission: Math.round(totalCommission),
          netRevenue: Math.round(totalRevenue - totalCommission),
          totalDeposits: Math.round(totalDeposits),
          totalWithdrawals: Math.round(totalWithdrawals),
          newUsers: newUsers?.length || 0,
          totalOrders: orders?.length || 0,
          cancelledOrders: (orders || []).filter((o) => o.status === 'cancelled').length,
        },
        revenueByDay: Object.entries(revenueByDay)
          .map(([date, amount]) => ({ date, amount: Math.round(amount) }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        topProducts: topProductsList,
      })
    } catch (err) {
      console.error('getReports error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
