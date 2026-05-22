import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

router.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`,
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  }

  try {
    const { data, error } = await supabase.from('system_settings').select('key').limit(1)
    checks.database = error ? 'error' : data ? 'ok' : 'error'
  } catch {
    checks.database = 'error'
  }

  const allOk = Object.values(checks).every((v) => v !== 'error')
  res.status(allOk ? 200 : 503).json(checks)
})

router.get('/health/detailed', async (req, res) => {
  try {
    const { count: users } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    const { count: orders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    const { data: lastCycle } = await supabase
      .from('commission_cycles')
      .select('week_start, status')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    res.json({
      users: users || 0,
      orders: orders || 0,
      lastCommissionCycle: lastCycle || null,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/health/db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ranks')
      .select('name, sort_order')
      .order('sort_order')
    if (error) throw error
    res.json({
      status: 'ok',
      ranks: data,
      hint: data?.length === 0 ? 'Connected — run seed.sql in Supabase if ranks should be populated' : undefined,
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.get('/health/setup', async (req, res) => {
  const issues = []
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim() || ''
  const usingPublishableKey =
    serviceKey.startsWith('sb_publishable') || serviceKey === process.env.SUPABASE_ANON_KEY?.trim()

  let ranksCount = 0
  let usersCount = 0
  let hasAdmin = false

  try {
    const { count: rc, error: rErr } = await supabase
      .from('ranks')
      .select('*', { count: 'exact', head: true })
    if (rErr) throw rErr
    ranksCount = rc || 0

    const { count: uc, error: uErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    if (uErr) throw uErr
    usersCount = uc || 0

    const { data: admin } = await supabase
      .from('users')
      .select('user_code')
      .eq('user_code', 'USR-000000')
      .maybeSingle()
    hasAdmin = !!admin
  } catch (err) {
    issues.push({
      code: 'DB_READ',
      messageAr: `تعذّر قراءة قاعدة البيانات: ${err.message}`,
      fix: 'تحقق من SUPABASE_URL والمفاتيح في .env',
    })
  }

  const probeId = `probe_${Date.now()}`
  const { data: probeUser, error: writeErr } = await supabase
    .from('users')
    .insert({
      username: probeId,
      email: `${probeId}@probe.local`,
      password_hash: '$2b$10$probe.probe.probe.probe.probe.probe',
      full_name: 'Probe',
      national_id: probeId.slice(0, 14),
      role: 'ambassador',
      status: 'pending',
    })
    .select('id')
    .single()

  let canWrite = false
  if (probeUser?.id) {
    canWrite = true
    await supabase.from('users').delete().eq('id', probeUser.id)
  } else if (writeErr?.code === '42501') {
    issues.push({
      code: 'RLS',
      messageAr: 'قاعدة البيانات ترفض إنشاء الحسابات (RLS). التسجيل لن يعمل حتى تُصلَح الإعدادات.',
      fix: 'npm run db:setup  — أو شغّل server/src/db/rls-backend.sql في Supabase SQL Editor',
    })
  } else if (writeErr) {
    issues.push({
      code: 'DB_WRITE',
      messageAr: writeErr.message,
      fix: 'راجع schema.sql واتصال Supabase',
    })
  }

  if (canWrite && ranksCount === 0) {
    issues.push({
      code: 'SEED',
      messageAr: 'جدول الرتب فارغ — التسجيل يعمل لكن بدون رتبة BAP.',
      fix: 'npm run db:setup  — أو شغّل seed.sql في Supabase',
    })
  }

  if (canWrite && usersCount > 0 && !hasAdmin) {
    issues.push({
      code: 'ADMIN',
      messageAr: 'لا يوجد حساب USR-000000 للإحالة.',
      fix: 'شغّل admin-bootstrap.sql أو سجّل أول مستخدم بدون كود إحالة',
    })
  }

  if (usingPublishableKey && !canWrite) {
    issues.push({
      code: 'KEY',
      messageAr: 'المفتاح في .env هو publishable وليس service_role.',
      fix: 'ضع SUPABASE_SERVICE_KEY من Dashboard → API → service_role (سري)',
    })
  }

  const ready = canWrite && issues.filter((i) => i.code === 'RLS' || i.code === 'DB_WRITE' || i.code === 'DB_READ').length === 0

  res.json({
    ready,
    canWrite,
    ranksCount,
    usersCount,
    hasAdmin,
    isFirstUserSlot: usersCount === 0 && canWrite,
    usingPublishableKey,
    issues,
  })
})

export { router as healthRouter }
