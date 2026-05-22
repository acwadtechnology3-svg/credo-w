#!/usr/bin/env node
import 'dotenv/config'

const BASE = process.env.API_BASE || 'http://localhost:3001/api'
let passed = 0
let failed = 0

function ok(n) {
  passed++
  console.log(`✓ ${n}`)
}
function fail(n, d) {
  failed++
  console.log(`✗ ${n}: ${d}`)
}

const health = await fetch(`${BASE}/health`)
const h = await health.json()
if (health.status === 200 && h.server === 'ok') ok('GET /health')
else fail('GET /health', JSON.stringify(h))

const detailed = await fetch(`${BASE}/health/detailed`)
if (detailed.status === 200) ok('GET /health/detailed')
else fail('GET /health/detailed', detailed.status)

const missing = await fetch(`${BASE}/nonexistent-route-xyz`)
if (missing.status === 404) ok('API 404 handler')
else fail('API 404', missing.status)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
