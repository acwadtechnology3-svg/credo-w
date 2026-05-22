#!/usr/bin/env node
/**
 * Applies fix-support-messages-rls.sql when DATABASE_URL is set in .env
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, '../server/src/db/fix-support-messages-rls.sql')
const url = process.env.DATABASE_URL?.trim()

if (!url) {
  console.log(`
⚠️  إرسال رسائل الدعم محجوب بـ RLS على support_messages.

━━━ الحل (دقيقة واحدة) ━━━
1. افتح Supabase → SQL Editor
2. انسخ والصق: server/src/db/fix-support-messages-rls.sql
3. Run

أو ضع SUPABASE_SERVICE_KEY = service_role (السري) من Dashboard → API في .env
(ليس sb_publishable_…)
`)
  process.exit(1)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  await client.query(readFileSync(sqlPath, 'utf8'))
  console.log('✓ fix-support-messages-rls applied successfully')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
