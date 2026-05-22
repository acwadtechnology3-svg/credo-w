import bcrypt from 'bcrypt'
import { supabase } from '../lib/supabase.js'
import { walletService } from '../services/wallet.service.js'
import { roundMoney } from '../lib/money.js'

export const superAdminController = {
  async getPackages(req, res) {
    try {
      const { data } = await supabase.from('packages').select('*').order('sort_order')
      return res.json(data || [])
    } catch (err) {
      console.error('getPackages error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createPackage(req, res) {
    try {
      const {
        name,
        description,
        price_egp,
        bv_points,
        pv_points,
        direct_commission_egp,
        vouchers_count,
        pearls_amount,
        sort_order,
      } = req.body
      if (!name || !price_egp) return res.status(400).json({ error: 'Name and price required' })

      const { data, error } = await supabase
        .from('packages')
        .insert({
          name,
          description,
          price_egp,
          bv_points: bv_points || 0,
          pv_points: pv_points || 0,
          direct_commission_egp: direct_commission_egp || 0,
          vouchers_count: vouchers_count || 0,
          pearls_amount: pearls_amount || 0,
          sort_order: sort_order || 0,
        })
        .select()
        .single()
      if (error) throw error

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'CREATE_PACKAGE',
        entity: 'packages',
        entity_id: data.id,
        new_value: data,
        ip_address: req.ip,
      })
      return res.status(201).json(data)
    } catch (err) {
      console.error('createPackage error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updatePackage(req, res) {
    try {
      const { data: old } = await supabase.from('packages').select('*').eq('id', req.params.id).single()
      const { data, error } = await supabase
        .from('packages')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_PACKAGE',
        entity: 'packages',
        entity_id: req.params.id,
        old_value: old,
        new_value: data,
        ip_address: req.ip,
      })
      return res.json(data)
    } catch (err) {
      console.error('updatePackage error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deletePackage(req, res) {
    try {
      await supabase.from('packages').update({ is_active: false }).eq('id', req.params.id)
      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'DELETE_PACKAGE',
        entity: 'packages',
        entity_id: req.params.id,
        ip_address: req.ip,
      })
      return res.json({ message: 'Package deactivated' })
    } catch (err) {
      console.error('deletePackage error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getRanks(req, res) {
    try {
      const { data } = await supabase.from('ranks').select('*').order('sort_order')
      return res.json(data || [])
    } catch (err) {
      console.error('getRanks error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateRank(req, res) {
    try {
      const allowed = [
        'name',
        'pbv_required',
        'matching_bv_required',
        'directs_required',
        'commission_pct',
        'weekly_cap_egp',
        'monthly_cap_egp',
        'rank_bonus_usd',
        'direct_commission_pct',
        'lead_team_bonus_pct',
        'sort_order',
      ]

      const updateData = {}
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) updateData[key] = req.body[key]
      })

      const { data: old } = await supabase.from('ranks').select('*').eq('id', req.params.id).single()
      const { data, error } = await supabase
        .from('ranks')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_RANK',
        entity: 'ranks',
        entity_id: req.params.id,
        old_value: old,
        new_value: data,
        ip_address: req.ip,
      })
      return res.json(data)
    } catch (err) {
      console.error('updateRank error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createRank(req, res) {
    try {
      const {
        name,
        pbv_required,
        matching_bv_required,
        directs_required,
        commission_pct,
        weekly_cap_egp,
        monthly_cap_egp,
        rank_bonus_usd,
        sort_order,
      } = req.body
      const { data, error } = await supabase
        .from('ranks')
        .insert({
          name,
          pbv_required,
          matching_bv_required,
          directs_required,
          commission_pct,
          weekly_cap_egp,
          monthly_cap_egp,
          rank_bonus_usd,
          sort_order,
        })
        .select()
        .single()
      if (error) throw error

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'CREATE_RANK',
        entity: 'ranks',
        entity_id: data.id,
        new_value: data,
        ip_address: req.ip,
      })
      return res.status(201).json(data)
    } catch (err) {
      console.error('createRank error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getLevelBonusSettings(req, res) {
    try {
      const keys = [
        'level_bonus_l1_pct',
        'level_bonus_l2_pct',
        'level_bonus_l3_pct',
        'level_bonus_l4_pct',
        'level_bonus_l5_pct',
      ]
      const { data } = await supabase.from('system_settings').select('*').in('key', keys).order('key')
      return res.json(data || [])
    } catch (err) {
      console.error('getLevelBonusSettings error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateLevelBonus(req, res) {
    try {
      const { l1, l2, l3, l4, l5 } = req.body
      const updates = [
        { key: 'level_bonus_l1_pct', value: String(l1) },
        { key: 'level_bonus_l2_pct', value: String(l2) },
        { key: 'level_bonus_l3_pct', value: String(l3) },
        { key: 'level_bonus_l4_pct', value: String(l4) },
        { key: 'level_bonus_l5_pct', value: String(l5) },
      ]

      for (const u of updates) {
        await supabase
          .from('system_settings')
          .update({ value: u.value, updated_at: new Date().toISOString() })
          .eq('key', u.key)
      }

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_LEVEL_BONUS',
        entity: 'system_settings',
        entity_id: null,
        new_value: { l1, l2, l3, l4, l5 },
        ip_address: req.ip,
      })
      return res.json({ message: 'Level bonus percentages updated' })
    } catch (err) {
      console.error('updateLevelBonus error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getFinancialSettings(req, res) {
    try {
      const { data } = await supabase.from('system_settings').select('*').order('key')
      return res.json(data || [])
    } catch (err) {
      console.error('getFinancialSettings error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateFinancialSetting(req, res) {
    try {
      const { value } = req.body
      const { data: old } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', req.params.key)
        .single()
      const { data, error } = await supabase
        .from('system_settings')
        .update({ value: String(value), updated_at: new Date().toISOString() })
        .eq('key', req.params.key)
        .select()
        .single()
      if (error) throw error

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_SYSTEM_SETTING',
        entity: 'system_settings',
        entity_id: null,
        old_value: { key: req.params.key, value: old?.value },
        new_value: { key: req.params.key, value },
        ip_address: req.ip,
      })
      return res.json(data)
    } catch (err) {
      console.error('updateFinancialSetting error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getAdmins(req, res) {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, user_code, username, email, full_name, role, status, created_at, last_login_at')
        .in('role', ['admin', 'super_admin'])
        .order('created_at')
      return res.json(data || [])
    } catch (err) {
      console.error('getAdmins error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createAdmin(req, res) {
    try {
      const { username, email, password, full_name, role } = req.body
      if (!['admin', 'franchise'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role for admin creation' })
      }

      const password_hash = await bcrypt.hash(password, 10)
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
      const user_code = `USR-${String((count || 0) + 1).padStart(6, '0')}`

      const { data, error } = await supabase
        .from('users')
        .insert({
          user_code,
          username,
          email,
          password_hash,
          full_name,
          role,
          status: 'active',
          country: 'Egypt',
        })
        .select('id, user_code, username, email, role')
        .single()
      if (error) throw error

      await walletService.createUserWallets(data.id)

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'CREATE_ADMIN',
        entity: 'users',
        entity_id: data.id,
        new_value: { username, role },
        ip_address: req.ip,
      })
      return res.status(201).json(data)
    } catch (err) {
      console.error('createAdmin error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateAdminRole(req, res) {
    try {
      const { role } = req.body
      if (!['admin', 'ambassador', 'franchise'].includes(role)) {
        return res.status(400).json({ error: 'Cannot set this role' })
      }

      const { data: target } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.params.id)
        .single()
      if (target?.role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot modify super admin role' })
      }

      await supabase.from('users').update({ role }).eq('id', req.params.id)
      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'UPDATE_ADMIN_ROLE',
        entity: 'users',
        entity_id: req.params.id,
        new_value: { role },
        ip_address: req.ip,
      })
      return res.json({ message: 'Role updated' })
    } catch (err) {
      console.error('updateAdminRole error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async setMaintenanceMode(req, res) {
    try {
      const { enabled, message } = req.body
      await supabase
        .from('system_settings')
        .update({ value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
        .eq('key', 'maintenance_mode')
      if (message) {
        await supabase.from('system_settings').upsert({
          key: 'maintenance_message',
          value: message,
          description: 'Maintenance message shown to users',
        })
      }
      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: enabled ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF',
        entity: 'system',
        entity_id: null,
        new_value: { enabled, message },
        ip_address: req.ip,
      })
      return res.json({ message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}` })
    } catch (err) {
      console.error('setMaintenanceMode error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async reverseCommission(req, res) {
    try {
      const { user_id, amount, reason } = req.body
      if (!user_id || !amount || !reason) {
        return res.status(400).json({ error: 'user_id, amount and reason required' })
      }

      const debitAmount = roundMoney(parseFloat(amount))
      await walletService.credit(
        user_id,
        'EARNINGS',
        -debitAmount,
        'ADJUSTMENT',
        `Commission reversed: ${reason}`
      )

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'COMMISSION_REVERSAL',
        entity: 'users',
        entity_id: user_id,
        new_value: { amount: debitAmount, reason },
        ip_address: req.ip,
      })

      await supabase.from('notifications').insert({
        user_id,
        type: 'ADJUSTMENT',
        title: 'Commission adjustment',
        body: `EGP ${debitAmount} has been adjusted from your earnings. Reason: ${reason}`,
      })

      return res.json({ message: 'Commission reversed successfully' })
    } catch (err) {
      console.error('reverseCommission error:', err)
      if (err.code === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'Insufficient earnings balance' })
      }
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async grantBV(req, res) {
    try {
      const { user_id, amount, side, reason } = req.body
      if (!user_id || !amount || !side || !reason) {
        return res.status(400).json({ error: 'user_id, amount, side and reason required' })
      }

      const bv = roundMoney(parseFloat(amount))
      const normalizedSide = side.toUpperCase() === 'RIGHT' ? 'RIGHT' : 'LEFT'

      await supabase.from('bv_logs').insert({
        user_id,
        side: normalizedSide,
        amount: bv,
        source_user_id: req.user.userId,
        note: `Manual BV grant: ${reason}`,
      })

      const { data: user } = await supabase.from('users').select('total_pv').eq('id', user_id).single()
      if (user) {
        await supabase
          .from('users')
          .update({ total_pv: roundMoney(parseFloat(user.total_pv) + bv) })
          .eq('id', user_id)
      }

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'MANUAL_BV_GRANT',
        entity: 'users',
        entity_id: user_id,
        new_value: { amount: bv, side: normalizedSide, reason },
        ip_address: req.ip,
      })

      return res.json({ message: `BV ${bv} granted on ${normalizedSide} side` })
    } catch (err) {
      console.error('grantBV error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getPlatformStats(req, res) {
    try {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: pendingUsers },
        { count: totalOrders },
        { data: revenue },
        { data: commissions },
        { count: pendingWithdrawals },
        { data: topMarketers },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').neq('status', 'cancelled'),
        supabase
          .from('wallet_transactions')
          .select('amount')
          .eq('category', 'TEAM_COMMISSION'),
        supabase
          .from('withdrawals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'requested'),
        supabase
          .from('users')
          .select('id, username, total_pv, commission_paid_total, ranks(name)')
          .eq('status', 'active')
          .order('commission_paid_total', { ascending: false })
          .limit(10),
      ])

      const totalRevenue = (revenue || []).reduce((s, o) => s + parseFloat(o.total || 0), 0)
      const totalCommissionPaid = (commissions || []).reduce(
        (s, t) => s + parseFloat(t.amount || 0),
        0
      )

      return res.json({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        pendingUsers: pendingUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue: Math.round(totalRevenue),
        totalCommissionPaid: Math.round(totalCommissionPaid),
        pendingWithdrawals: pendingWithdrawals || 0,
        topMarketers: topMarketers || [],
      })
    } catch (err) {
      console.error('getPlatformStats error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
