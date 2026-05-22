#!/usr/bin/env node
/**
 * Applies shop-phase4.sql when DATABASE_URL is set in .env
 * Otherwise prints instructions to run setup-once.sql in Supabase SQL Editor.
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, '../server/src/db/shop-phase4.sql')
const rlsPath = join(__dirname, '../server/src/db/fix-cart-rls.sql')
const url = process.env.DATABASE_URL?.trim()

if (!url) {
  console.log(`
⚠️  جدول cart_items غير موجود في Supabase — المتجر لن يعمل بدونها.

━━━ الحل (دقيقة واحدة) ━━━
1. افتح Supabase → SQL Editor
2. انسخ والصق أحد الملفين:
   • server/src/db/shop-phase4.sql  (الجدول + الدالة)
   • server/src/db/fix-cart-rls.sql  (إصلاح صلاحيات السلة — مهم!)
   • أو server/src/db/setup-once.sql (من السطر 103)
3. Run
4. أعد: npm run test:shop
`)
  process.exit(1)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  await client.query(readFileSync(sqlPath, 'utf8'))
  await client.query(readFileSync(rlsPath, 'utf8'))
  console.log('✓ shop-phase4 + fix-cart-rls applied successfully')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
