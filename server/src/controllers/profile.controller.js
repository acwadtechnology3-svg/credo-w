import { supabase, getStorageSupabase } from '../lib/supabase.js'
import { resolveAvatarDisplayUrl } from '../lib/avatarUrl.js'
import bcrypt from 'bcrypt'
import {
  syncGamification,
  evaluateAchievements,
  getUserAchievements,
  getRankTimeline,
  levelProgress,
} from '../services/profileGamification.service.js'
import { getUserTeam, getTeamLeaderboard } from '../services/teams.service.js'

export const profileController = {
  async getProfile(req, res) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, user_code, username, email, full_name, title, national_id, phone, country, currency, profile_image, role, status, total_pv, direct_count, created_at, active_date, ranks(name, commission_pct, sort_order)'
        )
        .eq('id', req.user.userId)
        .single()

      if (error) return res.status(404).json({ error: 'User not found' })
      if (data.profile_image) {
        data.profile_image = await resolveAvatarDisplayUrl(data.profile_image)
      }
      return res.json(data)
    } catch (err) {
      console.error('getProfile error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async uploadProfileImage(req, res) {
    try {
      const { base64, filename } = req.body
      if (!base64 || !filename) {
        return res.status(400).json({ error: 'base64 and filename required' })
      }

      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64')
      const maxBytes = 3 * 1024 * 1024
      if (buffer.length > maxBytes) {
        return res.status(400).json({ error: 'Image must be under 3MB' })
      }

      const ext = (filename.split('.').pop() || 'jpg').toLowerCase()
      const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      if (!allowed.includes(ext)) {
        return res.status(400).json({ error: 'Only JPG, PNG, WebP or GIF images are allowed' })
      }

      const mime =
        ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'gif'
              ? 'image/gif'
              : 'image/jpeg'

      const storage = getStorageSupabase()
      const userId = req.user.userId
      const path = `avatars/${userId}/${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`

      const { error: uploadErr } = await storage.storage
        .from('credo-w-media')
        .upload(path, buffer, { contentType: mime, upsert: false })
      if (uploadErr) {
        const isRls = /row-level security|RLS/i.test(uploadErr.message || '')
        throw Object.assign(uploadErr, {
          userMessage: isRls
            ? 'Storage blocked by RLS — set SUPABASE_SERVICE_KEY in .env and run server/src/db/phase-storage-policies.sql'
            : uploadErr.message,
        })
      }

      const { data, error } = await supabase
        .from('users')
        .update({ profile_image: path, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('profile_image')
        .single()
      if (error) throw error

      const displayUrl = await resolveAvatarDisplayUrl(path, storage)

      return res.json({
        url: displayUrl,
        profile_image: displayUrl,
        storage_path: path,
      })
    } catch (err) {
      console.error('uploadProfileImage error:', err)
      return res.status(500).json({ error: err.userMessage || err.message || 'Upload failed' })
    }
  },

  async updateProfile(req, res) {
    try {
      const { full_name, title, phone, country, currency, profile_image } = req.body
      const updates = {
        full_name,
        title,
        phone,
        country,
        currency,
        updated_at: new Date().toISOString(),
      }
      if (profile_image !== undefined) updates.profile_image = profile_image || null

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', req.user.userId)
        .select(
          'id, username, email, full_name, title, phone, country, currency, profile_image'
        )
        .single()

      if (error) throw error
      return res.json({ message: 'Profile updated', user: data })
    } catch (err) {
      console.error('updateProfile error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async changePassword(req, res) {
    try {
      const { current_password, new_password, confirm_password } = req.body

      if (new_password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' })
      }
      if (new_password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' })
      }

      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', req.user.userId)
        .single()

      const valid = await bcrypt.compare(current_password, user.password_hash)
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

      const newHash = await bcrypt.hash(new_password, 10)
      await supabase
        .from('users')
        .update({ password_hash: newHash, updated_at: new Date().toISOString() })
        .eq('id', req.user.userId)

      await supabase.from('audit_logs').insert({
        actor_id: req.user.userId,
        action: 'CHANGE_PASSWORD',
        entity: 'users',
        entity_id: req.user.userId,
      })

      return res.json({ message: 'Password changed successfully' })
    } catch (err) {
      console.error('changePassword error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async setCMoneyPin(req, res) {
    try {
      const { pin, current_password } = req.body

      if (!pin || String(pin).length !== 6 || Number.isNaN(Number(pin))) {
        return res.status(400).json({ error: 'PIN must be exactly 6 digits' })
      }

      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', req.user.userId)
        .single()

      const valid = await bcrypt.compare(current_password, user.password_hash)
      if (!valid) return res.status(401).json({ error: 'Password is incorrect' })

      const pinHash = await bcrypt.hash(String(pin), 10)
      await supabase
        .from('users')
        .update({
          cmoney_pin_hash: pinHash,
          cmoney_pin_attempts: 0,
          cmoney_locked_until: null,
        })
        .eq('id', req.user.userId)

      return res.json({ message: 'C Money PIN set successfully' })
    } catch (err) {
      console.error('setCMoneyPin error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async hasCMoneyPin(req, res) {
    try {
      const { data } = await supabase
        .from('users')
        .select('cmoney_pin_hash')
        .eq('id', req.user.userId)
        .single()
      return res.json({ has_pin: !!data?.cmoney_pin_hash })
    } catch (err) {
      console.error('hasCMoneyPin error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getProfileHub(req, res) {
    try {
      const userId = req.user.userId

      const { data: user, error: userErr } = await supabase
        .from('users')
        .select(
          'id, user_code, username, email, full_name, title, national_id, phone, country, currency, profile_image, role, status, total_pv, direct_count, created_at, active_date, last_login_at, current_package_level, commission_paid_total, ranks(id, name, commission_pct, sort_order, pbv_required, matching_bv_required)'
        )
        .eq('id', userId)
        .single()

      if (userErr || !user) return res.status(404).json({ error: 'User not found' })

      if (user.profile_image) {
        user.profile_image = await resolveAvatarDisplayUrl(user.profile_image)
      }

      const { data: bvLogs } = await supabase
        .from('bv_logs')
        .select('side, amount')
        .eq('user_id', userId)

      const sideA =
        bvLogs?.filter((b) => b.side === 'LEFT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0
      const sideB =
        bvLogs?.filter((b) => b.side === 'RIGHT').reduce((s, b) => s + parseFloat(b.amount), 0) || 0

      const { data: nextRank } = await supabase
        .from('ranks')
        .select('*')
        .gt('sort_order', user.ranks?.sort_order || 0)
        .order('sort_order')
        .limit(1)
        .maybeSingle()

      const matchBv = Math.min(sideA, sideB)
      const nextMatchReq = nextRank?.matching_bv_required || 1
      const rankProgressPct = Math.min(100, (matchBv / nextMatchReq) * 100)

      const { data: wallets } = await supabase
        .from('wallets')
        .select('type, balance')
        .eq('user_id', userId)

      const { data: recentTx } = await supabase
        .from('wallet_transactions')
        .select('category, amount, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12)

      let team = null
      let teamLeaderboard = []
      try {
        team = await getUserTeam(userId)
        teamLeaderboard = await getTeamLeaderboard(10)
      } catch (e) {
        console.warn('Team tables may not exist yet:', e.message)
      }

      const metrics = {
        totalPv: parseFloat(user.total_pv || 0),
        directCount: user.direct_count || 0,
        sideA,
        sideB,
        commissionTotal: parseFloat(user.commission_paid_total || 0),
        rankSortOrder: user.ranks?.sort_order || 0,
        packageLevel: user.current_package_level || 0,
        hasTeam: !!team,
        streakDays: 0,
      }

      let gamification = null
      let achievements = []
      let rankTimeline = []
      try {
        gamification = await syncGamification(userId, metrics)
        metrics.streakDays = gamification.streak_days
        await evaluateAchievements(userId, metrics)
        achievements = await getUserAchievements(userId)
        rankTimeline = await getRankTimeline(userId)
      } catch (e) {
        console.warn('Gamification tables may not exist yet:', e.message)
        gamification = {
          xp: 0,
          level: 1,
          prestige: 0,
          streak_days: 0,
          power_score: 0,
          network_score: 0,
          referral_score: 0,
          is_public: false,
          share_slug: null,
          progress: levelProgress(0),
        }
      }

      const isOnline =
        user.last_login_at &&
        Date.now() - new Date(user.last_login_at).getTime() < 15 * 60 * 1000

      const referralUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/register?ref=${user.user_code}`

      return res.json({
        user: {
          ...user,
          ranks: user.ranks,
          rank: user.ranks,
          is_online: isOnline,
        },
        bv: { sideA, sideB, matching: matchBv },
        nextRank,
        rankProgress: {
          pct: rankProgressPct,
          matchingBv: matchBv,
          requiredBv: nextMatchReq,
          personalBv: parseFloat(user.total_pv || 0),
          requiredPersonalBv: nextRank?.pbv_required || 0,
        },
        wallets: {
          earnings: wallets?.find((w) => w.type === 'EARNINGS')?.balance || 0,
          cmoney: wallets?.find((w) => w.type === 'CMONEY')?.balance || 0,
          pearls: wallets?.find((w) => w.type === 'PEARLS')?.balance || 0,
        },
        recentActivity: recentTx || [],
        team,
        teamLeaderboard,
        gamification,
        achievements,
        rankTimeline,
        membership: {
          level: user.current_package_level || 0,
          label:
            { 0: 'Free', 1: 'Mono', 3: 'Triple', 7: 'Septuple' }[user.current_package_level] ||
            `L${user.current_package_level}`,
        },
        social: {
          referral_url: referralUrl,
          share_slug: gamification?.share_slug,
          is_public: gamification?.is_public ?? false,
        },
        scores: {
          power: gamification?.power_score ?? 0,
          network: gamification?.network_score ?? 0,
          referral: gamification?.referral_score ?? 0,
          team_contribution: team?.my_contribution_bv ?? 0,
        },
      })
    } catch (err) {
      console.error('getProfileHub error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateIdentitySettings(req, res) {
    try {
      const { is_public, profile_banner_url } = req.body
      const updates = { updated_at: new Date().toISOString() }
      if (is_public !== undefined) updates.is_public = !!is_public
      if (profile_banner_url !== undefined) updates.profile_banner_url = profile_banner_url

      const { data, error } = await supabase
        .from('user_gamification')
        .update(updates)
        .eq('user_id', req.user.userId)
        .select()
        .single()

      if (error) throw error
      return res.json({ gamification: data })
    } catch (err) {
      console.error('updateIdentitySettings:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },
}
