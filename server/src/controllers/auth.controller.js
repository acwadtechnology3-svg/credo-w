import bcrypt from 'bcrypt'
import { supabase } from '../lib/supabase.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js'
import { treeService } from '../services/tree.service.js'
import { walletService } from '../services/wallet.service.js'
import { sendWelcomeEmail } from '../lib/mailer.js'
import { resolveAvatarDisplayUrl } from '../lib/avatarUrl.js'
import { pearlsService } from '../services/pearls.service.js'

const generateUserCode = async () => {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return `USR-${String((count || 0) + 1).padStart(6, '0')}`
}

const userSelect =
  '*, ranks(name, commission_pct, weekly_cap_egp, sort_order, rank_bonus_usd)'

function digitsOnly(value) {
  return String(value).replace(/\D/g, '')
}

async function findUserByLogin(identifier) {
  const id = identifier.trim()
  const idLower = id.toLowerCase()

  const { data: byUsername } = await supabase
    .from('users')
    .select(userSelect)
    .eq('username', id)
    .maybeSingle()
  if (byUsername) return byUsername

  const { data: byEmail } = await supabase
    .from('users')
    .select(userSelect)
    .ilike('email', idLower)
    .maybeSingle()
  if (byEmail) return byEmail

  const { data: byCode } = await supabase
    .from('users')
    .select(userSelect)
    .eq('user_code', id)
    .maybeSingle()
  if (byCode) return byCode

  // Phone: full number, or mistaken "name@01xxxxxxxxx" style
  const phoneDigits = digitsOnly(id.includes('@') ? id.split('@').pop() : id)
  if (phoneDigits.length >= 10) {
    const tail = phoneDigits.slice(-10)
    const { data: users } = await supabase
      .from('users')
      .select(userSelect)
      .not('phone', 'is', null)
      .limit(100)

    const match = (users || []).find((u) => {
      const stored = digitsOnly(u.phone)
      if (stored.length < 10) return false
      return stored === phoneDigits || stored.endsWith(tail) || phoneDigits.endsWith(stored.slice(-10))
    })
    if (match) return match
  }

  return null
}

async function issueAuthTokens(res, user) {
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id)

  try {
    await pearlsService.handleDailyLogin(user.id)
    await pearlsService.triggerMission(user.id, 'login')
    const { progressionEngine } = await import('../services/progressionEngine.service.js')
    await progressionEngine.onLogin(user.id)
  } catch (pearlErr) {
    console.warn('Pearls login:', pearlErr.message)
  }

  const payload = { userId: user.id, role: user.role, username: user.username }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken({ userId: user.id })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })

  const profile_image = user.profile_image
    ? await resolveAvatarDisplayUrl(user.profile_image)
    : null

  return res.json({
    accessToken,
    user: {
      id: user.id,
      user_code: user.user_code,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      rank: user.ranks,
      profile_image,
      currency: user.currency,
      country: user.country,
    },
  })
}

export const authController = {
  async login(req, res) {
    try {
      const { username_or_email, password } = req.body
      if (!username_or_email || !password) {
        return res.status(400).json({ error: 'Username and password required' })
      }

      const loginId = username_or_email.trim()
      const user = await findUserByLogin(loginId)
      if (!user) {
        const looksLikeBadEmail = /^[^@]+@\d+$/.test(loginId)
        return res.status(401).json({
          error: 'Invalid credentials',
          hint: looksLikeBadEmail
            ? 'This login format is not registered. Try your username (omar1222), email (oa538154@gmail.com), or phone 01115840330.'
            : 'Check username, email, USR code, or phone number.',
        })
      }

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Account pending admin activation' })
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Account suspended' })
      }

      return issueAuthTokens(res, user)
    } catch (err) {
      console.error('Login error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async google(req, res) {
    try {
      const { access_token } = req.body
      if (!access_token) {
        return res.status(400).json({ error: 'Google access token required' })
      }

      const {
        data: { user: authUser },
        error: authErr,
      } = await supabase.auth.getUser(access_token)

      if (authErr || !authUser?.email) {
        return res.status(401).json({ error: 'Invalid or expired Google session' })
      }

      const email = authUser.email.trim().toLowerCase()
      const meta = authUser.user_metadata || {}
      const fullName =
        meta.full_name || meta.name || [meta.given_name, meta.family_name].filter(Boolean).join(' ') || ''

      const { data: appUser, error: userErr } = await supabase
        .from('users')
        .select(userSelect)
        .ilike('email', email)
        .maybeSingle()

      if (userErr) throw userErr

      if (!appUser) {
        return res.status(404).json({
          code: 'NEED_SIGNUP',
          error: 'No account for this Google email',
          email: authUser.email,
          full_name: fullName,
        })
      }

      if (appUser.status === 'pending') {
        return res.status(403).json({ error: 'Account pending admin activation' })
      }
      if (appUser.status === 'suspended') {
        return res.status(403).json({ error: 'Account suspended' })
      }
      if (appUser.status !== 'active') {
        return res.status(403).json({ error: 'Account not active' })
      }

      return issueAuthTokens(res, appUser)
    } catch (err) {
      console.error('Google auth error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async register(req, res) {
    try {
      const { ref, side, invite } = req.query
      const {
        username,
        email,
        password,
        confirm_password,
        full_name,
        title,
        national_id,
        phone,
        country,
      } = req.body

      if (!username || !email || !password || !full_name || !national_id) {
        return res.status(400).json({ error: 'All fields required' })
      }
      if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' })
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' })
      }

      const { count: userCount, error: countErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      if (countErr) throw countErr

      const isFirstUser = (userCount || 0) === 0
      const autoActive =
        process.env.REGISTER_AUTO_ACTIVE === 'true' ||
        (process.env.NODE_ENV !== 'production' && process.env.REGISTER_AUTO_ACTIVE !== 'false')

      let sponsor = null
      let placementSide = null
      let inviteCodeUsed = null

      const { agencyRegistrationService } = await import('../services/agencyRegistration.service.js')
      const agencyContext = await agencyRegistrationService.resolveJoinContext({
        agency: req.query.agency,
        agency_slug: req.query.agency_slug,
        agency_code: req.query.agency_code,
        ref,
        side,
        agency_invite: req.query.agency_invite,
      })

      if (
        (req.query.agency || req.query.agency_slug || req.query.agency_code || req.query.agency_invite) &&
        agencyContext.error
      ) {
        return res.status(400).json({ error: agencyContext.error })
      }

      const inviteToken = (invite || '').trim().toUpperCase()
      if (inviteToken) {
        const { invitationService } = await import('../services/invitation.service.js')
        const resolved = await invitationService.resolveInviteForRegistration(inviteToken)
        if (!resolved) {
          return res.status(400).json({ error: 'Invalid or expired invitation' })
        }
        sponsor = { id: resolved.sponsorId, status: 'active' }
        placementSide = resolved.placementSide
        inviteCodeUsed = inviteToken
      }

      const referralCode = (ref || '').trim()
      const sideFromLink = (side || '').trim().toUpperCase()

      if (!sponsor && agencyContext?.sponsor) {
        sponsor = { id: agencyContext.sponsor.id, status: 'active' }
        placementSide = agencyContext.placementSide || placementSide
      }

      if (!sponsor && referralCode) {
        const { data: found, error: sponsorErr } = await supabase
          .from('users')
          .select('id, username, status')
          .eq('user_code', referralCode)
          .maybeSingle()

        if (sponsorErr) throw sponsorErr
        if (!found) return res.status(400).json({ error: 'Invalid referral code' })
        if (found.status !== 'active') {
          return res.status(400).json({ error: 'Sponsor account is not active' })
        }
        sponsor = found
        placementSide = ['LEFT', 'RIGHT'].includes(sideFromLink) ? sideFromLink : 'AUTO'
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

      const { data: bapRank } = await supabase
        .from('ranks')
        .select('id')
        .eq('name', 'BAP')
        .maybeSingle()

      const password_hash = await bcrypt.hash(password, 10)
      const user_code = isFirstUser ? 'USR-000000' : await generateUserCode()

      const { data: newUser, error: userError } = await supabase
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
          sponsor_id: sponsor?.id ?? null,
          rank_id: bapRank?.id ?? null,
          role: isFirstUser ? 'admin' : 'ambassador',
          status: isFirstUser || autoActive ? 'active' : 'pending',
        })
        .select()
        .single()

      if (userError) {
        if (userError.code === '42501') {
          return res.status(503).json({
            error:
              'Database access blocked (RLS). Run rls-backend.sql in Supabase or set SUPABASE_SERVICE_KEY to service_role.',
          })
        }
        throw userError
      }

      try {
        const { treeActivationService } = await import('../services/treeActivation.service.js')
        if (isFirstUser) {
          await treeActivationService.queuePendingPlacement({
            userId: newUser.id,
            sponsorId: null,
            placementSide: 'AUTO',
            source: 'registration',
          })
        } else if (sponsor) {
          await treeActivationService.queuePendingPlacement({
            userId: newUser.id,
            sponsorId: sponsor.id,
            placementSide: placementSide || 'AUTO',
            agencyId: agencyContext?.agency?.id,
            source: inviteCodeUsed ? 'invite' : 'registration',
          })
        }
        await walletService.createUserWallets(newUser.id)
        if (sponsor) {
          try {
            await pearlsService.onReferralJoined(sponsor.id, newUser.id)
            const { progressionEngine } = await import('../services/progressionEngine.service.js')
            await progressionEngine.onReferralJoin(sponsor.id, newUser.id)
          } catch (pearlErr) {
            console.warn('Pearls referral:', pearlErr.message)
          }
        }
        if (inviteCodeUsed) {
          try {
            const { invitationService } = await import('../services/invitation.service.js')
            await invitationService.onUserRegistered(inviteCodeUsed, newUser.id, email)
            if (newUser.status === 'active') {
              await invitationService.onUserJoinedTeam(newUser.id)
            }
          } catch (invErr) {
            console.warn('Invitation tracking:', invErr.message)
          }
        }

        if (agencyContext?.ok && agencyContext.agency) {
          try {
            if (!placementSide && sponsor) {
              placementSide = await agencyRegistrationService.resolvePlacementForSponsor(
                sponsor.id,
                agencyContext.placementSide
              )
            } else if (!placementSide) {
              placementSide = agencyContext.placementSide
            }
            await agencyRegistrationService.applyAgencyMembership(newUser.id, agencyContext)
          } catch (agencyErr) {
            console.warn('Agency membership:', agencyErr.message)
          }
        }
      } catch (placementErr) {
        await supabase.from('users').delete().eq('id', newUser.id)
        throw placementErr
      }

      sendWelcomeEmail({
        to: email,
        recipientName: full_name,
      }).catch((mailErr) => {
        console.error('Welcome email failed (registration still succeeded):', mailErr.message)
      })

      const pendingMsg = 'Account created. Awaiting admin activation before login.'
      const activeMsg = 'Account created. You can log in now.'
      return res.status(201).json({
        message: newUser.status === 'active' ? activeMsg : pendingMsg,
        user_code: newUser.user_code,
        status: newUser.status,
      })
    } catch (err) {
      console.error('Register error:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async refresh(req, res) {
    try {
      const token = req.cookies?.refreshToken
      if (!token) return res.status(401).json({ error: 'No refresh token' })

      const payload = verifyRefreshToken(token)
      const { data: user } = await supabase
        .from('users')
        .select('id, role, username, status')
        .eq('id', payload.userId)
        .single()

      if (!user || user.status === 'suspended') {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const accessToken = signAccessToken({
        userId: user.id,
        role: user.role,
        username: user.username,
      })
      return res.json({ accessToken })
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }
  },

  async logout(req, res) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    })
    return res.json({ message: 'Logged out successfully' })
  },

  async me(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*, ranks(name, commission_pct, weekly_cap_egp, sort_order, rank_bonus_usd)')
        .eq('id', req.user.userId)
        .single()

      if (error || !user) return res.status(404).json({ error: 'User not found' })

      const { password_hash, cmoney_pin_hash, ...safeUser } = user
      if (safeUser.profile_image) {
        safeUser.profile_image = await resolveAvatarDisplayUrl(safeUser.profile_image)
      }
      return res.json({ user: safeUser })
    } catch (err) {
      console.error('Me error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
