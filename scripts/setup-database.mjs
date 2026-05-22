#!/usr/bin/env node
/**
 * One-time Supabase setup via direct Postgres (bypasses RLS issues with publishable key).
 *
 * 1. Supabase Dashboard → Project Settings → Database → Connection string → URI
 * 2. Add to .env: DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@...
 * 3. Run: npm run db:setup
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbDir = join(__dirname, '../server/src/db')

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error(`
❌  DATABASE_URL غير موجود في ملف .env

━━━ الطريقة الأسهل (بدون DATABASE_URL) ━━━
  1. افتح Supabase → SQL Editor → New query
  2. انسخ كل محتوى الملف:
     server/src/db/setup-once.sql
  3. Run
  4. أعد تشغيل: npm run dev

━━━ أو عبر التيرمنال (npm run db:setup) ━━━
  1. Supabase → Project Settings → Database
  2. Connection string → URI (انسخ الرابط)
  3. استبدل [YOUR-PASSWORD] بكلمة سر قاعدة البيانات
  4. أضف سطراً في .env:
     DATABASE_URL=postgresql://postgres.yxgbmhcobqeusgetynxc:كلمة_السر@....pooler.supabase.com:6543/postgres
  5. npm run db:setup
`)
  process.exit(1)
}

const files = [
  'rls-backend.sql',
  'seed.sql',
  'admin-bootstrap.sql',
  'shop-phase4.sql',
  'member-invitations-bootstrap.sql',
]
const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('Connected to database.\n')

  for (const file of files) {
    const path = join(dbDir, file)
    const sql = readFileSync(path, 'utf8')
    process.stdout.write(`→ ${file} ... `)
    try {
      await client.query(sql)
      console.log('OK')
    } catch (err) {
      if (file === 'seed.sql' && /duplicate key|already exists/i.test(err.message)) {
        console.log('skipped (already seeded)')
      } else {
        console.log('FAILED')
        console.error('  ', err.message)
      }
    }
  }

  const { rows } = await client.query(
    `SELECT (SELECT COUNT(*)::int FROM users) AS users,
            (SELECT COUNT(*)::int FROM ranks) AS ranks`
  )
  console.log('\nDone.', rows[0])
  console.log('Test login: admin / Admin@1234  —  or register a new user at /register')
} catch (err) {
  console.error('Setup failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
