#!/usr/bin/env node
/**
 * Quick signup smoke test: node scripts/test-register.mjs
 * Requires: npm run dev (or server on PORT), rls-backend.sql or service_role key
 */
import 'dotenv/config'

const port = process.env.PORT || 3001
const base = `http://127.0.0.1:${port}/api`

const payload = {
  username: `test_${Date.now().toString(36)}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123',
  confirm_password: 'TestPass123',
  full_name: 'Test User',
  national_id: String(Date.now()).slice(-14),
  phone: '01000000000',
  country: 'Egypt',
}

const res = await fetch(`${base}/auth/register?ref=USR-000000&side=LEFT`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
const body = await res.json().catch(() => ({}))
console.log(res.status, body)
process.exit(res.ok ? 0 : 1)
