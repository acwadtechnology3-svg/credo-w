#!/usr/bin/env node
/**
 * Creates member_invitations tables when DATABASE_URL is set in .env
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, '../server/src/db/member-invitations-bootstrap.sql')
const url = process.env.DATABASE_URL?.trim()

if (!url) {
  console.log(`
⚠️  جدول member_invitations غير موجود في Supabase.

━━━ الحل (دقيقة واحدة) ━━━
1. افتح Supabase → SQL Editor → New query
2. انسخ والصق كل محتوى الملف:
   server/src/db/member-invitations-bootstrap.sql
3. اضغط Run
4. أعد تحميل صفحة الإعدادات وجرب «Send premium email» مرة أخرى

━━━ أو عبر التيرمنال ━━━
أضف DATABASE_URL في .env ثم:
  npm run db:invitations
`)
  process.exit(1)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  await client.query(readFileSync(sqlPath, 'utf8'))
  const { rows } = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'member_invitations'
    ) AS ok`
  )
  console.log(rows[0]?.ok ? '✓ member_invitations tables created' : '✗ Table still missing')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
