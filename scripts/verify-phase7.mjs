#!/usr/bin/env node
/**
 * Phase 7 verification — run: node scripts/verify-phase7.mjs
 */
import 'dotenv/config'
import { io } from 'socket.io-client'

const BASE = process.env.API_BASE || 'http://localhost:3001/api'
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001'
let passed = 0
let failed = 0

function ok(name) {
  passed++
  console.log(`✓ ${name}`)
}
function fail(name, detail) {
  failed++
  console.log(`✗ ${name}: ${detail}`)
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data }
}

function waitForEvent(socket, event, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs)
    socket.once(event, (payload) => {
      clearTimeout(t)
      resolve(payload)
    })
  })
}

async function main() {
  console.log('Phase 7 verification\n')

  const login = await req('POST', '/auth/login', {
    body: { username_or_email: 'admin', password: 'Admin@1234' },
  })
  if (login.status !== 200 || !login.data?.accessToken) {
    fail('Admin login', `${login.status}`)
    process.exit(1)
  }
  const token = login.data.accessToken
  const userId = login.data.user?.id
  ok('Admin login')

  // Socket connects after login
  const socket = io(SOCKET_URL, { auth: { token }, reconnection: false })
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('socket connect timeout')), 5000)
      socket.on('connect', () => {
        clearTimeout(t)
        resolve()
      })
      socket.on('connect_error', (e) => {
        clearTimeout(t)
        reject(e)
      })
    })
    ok('Socket connects after login')
  } catch (e) {
    fail('Socket connects after login', e.message)
  }

  // Seed unread notification for badge test
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  await sb.from('notifications').insert({
    user_id: userId,
    type: 'TEST',
    title: 'Phase 7 unread test',
    body: 'Badge count check',
    is_read: false,
  })

  const notifs = await req('GET', '/notifications', { token })
  if (notifs.status !== 200) {
    fail('GET notifications', `${notifs.status}`)
  } else if (!Array.isArray(notifs.data?.notifications)) {
    fail('Notifications list', 'missing array')
  } else if (typeof notifs.data.unreadCount !== 'number') {
    fail('Unread count field', 'missing')
  } else if (notifs.data.unreadCount < 1) {
    fail('Bell unread count', `expected >= 1, got ${notifs.data.unreadCount}`)
  } else {
    ok(`Bell unread count (${notifs.data.unreadCount} unread, ${notifs.data.notifications.length} listed)`)
  }

  const markRead = await req('POST', '/notifications/read', { token, body: { ids: [] } })
  if (markRead.status !== 200) {
    fail('Mark all read', `${markRead.status}`)
  } else {
    const after = await req('GET', '/notifications', { token })
    if (after.data?.unreadCount !== 0) {
      fail('Mark all read effect', `unread still ${after.data?.unreadCount}`)
    } else {
      ok('Mark all read')
    }
  }

  // Profile edit
  const profileBefore = await req('GET', '/profile', { token })
  const newName = `Admin Test ${Date.now().toString().slice(-4)}`
  const update = await req('PUT', '/profile', {
    token,
    body: {
      full_name: newName,
      title: profileBefore.data?.title || 'Mr',
      phone: profileBefore.data?.phone || '',
      country: profileBefore.data?.country || 'EG',
      currency: profileBefore.data?.currency || 'EGP',
    },
  })
  if (update.status !== 200) {
    fail('Profile edit', `${update.status} ${JSON.stringify(update.data)}`)
  } else {
    const profileAfter = await req('GET', '/profile', { token })
    if (profileAfter.data?.full_name !== newName) {
      fail('Profile edit persisted', profileAfter.data?.full_name)
    } else {
      ok('Profile edit')
    }
  }

  // Change password (restore after)
  const pw = await req('POST', '/profile/change-password', {
    token,
    body: {
      current_password: 'Admin@1234',
      new_password: 'Admin@1234',
      confirm_password: 'Admin@1234',
    },
  })
  if (pw.status !== 200) {
    fail('Change password', `${pw.status} ${JSON.stringify(pw.data)}`)
  } else {
    ok('Change password')
  }

  // C Money PIN — 6 digits
  const badPin = await req('POST', '/profile/set-pin', {
    token,
    body: { pin: '12345', current_password: 'Admin@1234' },
  })
  if (badPin.status !== 400) {
    fail('PIN rejects non-6 digits', `status ${badPin.status}`)
  } else {
    ok('PIN rejects non-6 digits')
  }

  const setPin = await req('POST', '/profile/set-pin', {
    token,
    body: { pin: '123456', current_password: 'Admin@1234' },
  })
  if (setPin.status !== 200) {
    fail('C Money PIN setup', `${setPin.status} ${JSON.stringify(setPin.data)}`)
  } else {
    const hasPin = await req('GET', '/profile/has-pin', { token })
    if (!hasPin.data?.has_pin) {
      fail('has-pin after set', JSON.stringify(hasPin.data))
    } else {
      ok('C Money PIN setup (6 digits)')
    }
  }

  // Help center
  const ticket = await req('POST', '/support', {
    token,
    body: {
      category: 'General',
      message: 'Phase 7 verification ticket — please ignore',
    },
  })
  if (ticket.status !== 201) {
    fail('Help Center ticket submit', `${ticket.status}`)
  } else {
    ok('Help Center ticket submit')
  }

  const tickets = await req('GET', '/support/my', { token })
  if (tickets.status !== 200 || !Array.isArray(tickets.data)) {
    fail('My tickets list', `${tickets.status}`)
  } else if (tickets.data.length === 0) {
    fail('My tickets list', 'empty')
  } else {
    ok(`My tickets list (${tickets.data.length} tickets)`)
  }

  // Wallet real-time after credit (admin bonus → wallet:updated)
  const walletBefore = await req('GET', '/wallet/summary', { token })
  const balanceBefore = walletBefore.data?.earnings?.balance ?? 0

  const walletPromise = waitForEvent(socket, 'wallet:updated', 10000).catch((e) => e)

  const bonus = await req('POST', `/admin/users/${userId}/bonus`, {
    token,
    body: { amount: 1, wallet_type: 'EARNINGS', description: 'Phase 7 socket test' },
  })
  if (bonus.status !== 200) {
    fail('Admin bonus for wallet emit', `${bonus.status}`)
  }

  const walletEvent = await walletPromise
  if (walletEvent instanceof Error) {
    fail('Wallet real-time after credit', walletEvent.message)
  } else if (!walletEvent?.balance_after) {
    fail('Wallet real-time payload', JSON.stringify(walletEvent))
  } else {
    ok(`Wallet real-time (balance_after ${walletEvent.balance_after})`)
  }

  const walletAfter = await req('GET', '/wallet/summary', { token })
  const balanceAfter = walletAfter.data?.earnings?.balance ?? 0
  if (balanceAfter <= balanceBefore) {
    fail('Wallet balance increased', `${balanceBefore} → ${balanceAfter}`)
  } else {
    ok(`Wallet balance updated (${balanceBefore} → ${balanceAfter})`)
  }

  socket.disconnect()

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
