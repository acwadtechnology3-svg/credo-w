#!/usr/bin/env node
/**
 * Phase 5 smoke tests — run: node scripts/verify-phase5.mjs
 */
import 'dotenv/config'

const BASE = process.env.API_BASE || 'http://localhost:3001/api'
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

async function main() {
  console.log('Phase 5 verification\n')

  const login = await req('POST', '/auth/login', {
    body: { username_or_email: 'admin', password: 'Admin@1234' },
  })
  if (login.status !== 200 || !login.data?.accessToken) {
    fail('Admin login', `${login.status} ${JSON.stringify(login.data)}`)
    process.exit(1)
  }
  const token = login.data.accessToken
  ok('Admin login')

  const summary = await req('GET', '/wallet/summary', { token })
  if (summary.status !== 200) {
    fail('Wallet summary', `${summary.status}`)
  } else if (
    typeof summary.data?.cmoney?.balance !== 'number' &&
    summary.data?.cmoney?.balance !== undefined
  ) {
    fail('Wallet summary balances', JSON.stringify(summary.data?.cmoney))
  } else if (!Array.isArray(summary.data?.transactions)) {
    fail('Wallet transactions array', 'missing')
  } else {
    ok(
      `Wallet summary (earnings ${summary.data.earnings?.balance}, cmoney ${summary.data.cmoney?.balance}, txs ${summary.data.transactions.length})`
    )
  }

  const team = await req('GET', '/earnings/team-commission', { token })
  if (team.status !== 200 || !Array.isArray(team.data?.commissions)) {
    fail('Team commission', `${team.status} ${JSON.stringify(team.data)}`)
  } else {
    ok(`Team commission (totalBonus ${team.data.totalBonus}, rows ${team.data.commissions.length})`)
  }

  const rank = await req('GET', '/earnings/rank-bonus', { token })
  if (rank.status !== 200 || !Array.isArray(rank.data?.ranks)) {
    fail('Rank bonus', `${rank.status}`)
  } else if (!rank.data.ranks.every((r) => 'achieved' in r && 'bonus_paid' in r)) {
    fail('Rank bonus status fields', 'missing achieved/bonus_paid')
  } else {
    ok(`Rank bonus (${rank.data.ranks.length} ranks with status)`)
  }

  const banks = await req('GET', '/withdrawal/accounts', { token })
  let bankId = banks.data?.[0]?.id
  if (banks.status !== 200 || !Array.isArray(banks.data)) {
    fail('Bank accounts list', `${banks.status}`)
  } else {
    ok(`Bank accounts list (${banks.data.length})`)
  }

  if (!bankId) {
    const addBank = await req('POST', '/withdrawal/accounts', {
      token,
      body: {
        account_name: 'Test User',
        bank_name: 'CIB',
        account_number: 'TEST-' + Date.now(),
        is_default: true,
      },
    })
    if (addBank.status !== 201) {
      fail('Bank account create', `${addBank.status} ${JSON.stringify(addBank.data)}`)
    } else {
      bankId = addBank.data.id
      ok('Bank account create')
    }
  }

  const wBefore = await req('GET', '/withdrawal', { token })
  const earnBefore = wBefore.data?.available_balance ?? 0

  let earnBal = earnBefore
  if (earnBal < 500) {
    const cmBal = summary.data?.cmoney?.balance ?? 0
    if (cmBal >= 1000) {
      const ex = await req('POST', '/wallet/exchange', {
        token,
        body: { from: 'CMONEY', to: 'EARNINGS', amount: 1000, pin: '123456' },
      })
      if (ex.status === 200) {
        earnBal = 1000
        ok('Exchange CMONEY→EARNINGS (for withdrawal test)')
      }
    }
  }
  if (earnBal >= 500 && bankId) {
    const wReq = await req('POST', '/withdrawal/request', {
      token,
      body: { amount: 500, bank_account_id: bankId },
    })
    if (wReq.status !== 201) {
      fail('Withdrawal request', `${wReq.status} ${JSON.stringify(wReq.data)}`)
    } else {
      ok(`Withdrawal request (${wReq.data?.withdrawal?.status})`)
    }
  } else {
    console.log(`⚠ Withdrawal request skipped (earnings ${earnBal}, bank ${!!bankId})`)
  }

  if (bankId) {
    const delTest = await req('POST', '/withdrawal/accounts', {
      token,
      body: {
        account_name: 'Delete Me',
        bank_name: 'Test',
        account_number: 'DEL-' + Date.now(),
      },
    })
    if (delTest.status === 201 && delTest.data?.id) {
      const del = await req('DELETE', `/withdrawal/accounts/${delTest.data.id}`, { token })
      if (del.status === 200) ok('Bank account delete')
      else fail('Bank account delete', `${del.status}`)
    }
  }

  const pinSet = await req('POST', '/wallet/cmoney/set-pin', {
    token,
    body: { current_password: 'Admin@1234', pin: '123456' },
  })
  if (pinSet.status !== 200) {
    fail('Set PIN', `${pinSet.status} ${JSON.stringify(pinSet.data)}`)
  } else {
    ok('Set PIN')
  }

  const cmBefore = (await req('GET', '/wallet/summary', { token })).data?.cmoney?.balance ?? 0
  if (cmBefore >= 10) {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const { data: others } = await sb
      .from('users')
      .select('username')
      .eq('status', 'active')
      .neq('username', 'admin')
      .limit(1)
    const toUser = others?.[0]?.username
    if (toUser) {
      const tr = await req('POST', '/wallet/cmoney/transfer', {
        token,
        body: { to_username: toUser, amount: 1, pin: '123456' },
      })
      if (tr.status !== 200) {
        fail('C Money transfer', `${tr.status} ${JSON.stringify(tr.data)}`)
      } else {
        ok(`C Money transfer with PIN → ${toUser}`)
      }
    } else {
      console.log('⚠ C Money transfer skipped (no second active user)')
    }
  } else {
    console.log(`⚠ C Money transfer skipped (balance ${cmBefore})`)
  }

  const comm = await req('POST', '/earnings/commission/run', { token })
  if (comm.status === 400 && comm.data?.error?.includes('already ran')) {
    ok('Commission run (already ran this week — expected)')
  } else if (comm.status !== 200) {
    fail('Commission run admin', `${comm.status} ${JSON.stringify(comm.data)}`)
  } else {
    ok(`Commission run (${comm.data?.usersProcessed} users, ${comm.data?.totalPaid} paid)`)
  }

  const { readFileSync } = await import('fs')
  const idx = readFileSync(new URL('../server/index.js', import.meta.url), 'utf8')
  if (idx.includes('startCommissionJob()')) {
    ok('Commission cron wired in server/index.js')
  } else {
    fail('Commission cron', 'startCommissionJob not called')
  }

  const job = readFileSync(new URL('../server/src/jobs/commission.job.js', import.meta.url), 'utf8')
  if (job.includes("cron.schedule('0 0 * * 0'")) {
    ok('Commission cron schedule (Sunday midnight)')
  } else {
    fail('Commission cron schedule', 'missing')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
