/** Map Postgres / PostgREST errors to user-facing API messages. */

export function isMissingCartTable(err) {
  const msg = String(err?.message || err?.details || '')
  return (
    err?.code === 'PGRST205' ||
    err?.code === '42P01' ||
    /cart_items/i.test(msg) ||
    (/schema cache/i.test(msg) && /cart/i.test(msg))
  )
}

export function isCartRlsError(err) {
  return err?.code === '42501' || /row-level security/i.test(String(err?.message || ''))
}

export function cartSetupMessage(err) {
  if (isMissingCartTable(err)) {
    return 'جدول السلة غير موجود. شغّل server/src/db/shop-phase4.sql في Supabase SQL Editor.'
  }
  if (isCartRlsError(err)) {
    return 'صلاحيات السلة محجوبة (RLS). شغّل fix-cart-rls.sql أو ضع SUPABASE_SERVICE_KEY في .env.'
  }
  return err?.message || 'خطأ في السلة'
}

/** Package purchase blocked by RLS on user_packages or related tables. */
export function mapPurchaseRlsError(err) {
  if (!isCartRlsError(err)) return null
  const msg = String(err?.message || '')
  if (/user_packages/i.test(msg)) {
    return {
      status: 503,
      error:
        'صلاحيات سجل الباقات محجوبة (RLS). شغّل server/src/db/fix-user-packages-rls.sql في Supabase SQL Editor، أو ضع SUPABASE_SERVICE_KEY (service_role) في .env.',
      code: 'DB_RLS_USER_PACKAGES',
    }
  }
  return {
    status: 503,
    error:
      'صلاحيات قاعدة البيانات محجوبة (RLS). شغّل rls-backend.sql أو fix-user-packages-rls.sql في Supabase.',
    code: 'DB_RLS',
  }
}

export function mapMissingTableError(err, tableName) {
  const msg = String(err?.message || err?.details || '')
  const code = err?.code
  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    /schema cache/i.test(msg) ||
    new RegExp(`'public\\.${tableName}'`, 'i').test(msg) ||
    new RegExp(`relation "${tableName}" does not exist`, 'i').test(msg)
  ) {
    return {
      status: 503,
      error: `جدول ${tableName} غير موجود في قاعدة البيانات. شغّل server/src/db/member-invitations-bootstrap.sql في Supabase SQL Editor ثم أعد المحاولة.`,
      code: 'DB_TABLE_MISSING',
      table: tableName,
    }
  }
  return null
}

export function mapInviteError(err) {
  const missing = mapMissingTableError(err, 'member_invitations')
  if (missing) return missing

  const msg = String(err?.message || '')
  if (/SMTP_EMAIL|SMTP_PASSWORD/i.test(msg)) {
    return {
      status: 503,
      error: 'إعدادات البريد غير مكتملة على السيرفر (SMTP). تواصل مع الدعم أو جرّب مشاركة الرابط بدون إيميل.',
      code: 'SMTP_NOT_CONFIGURED',
    }
  }
  if (/Invalid login|EAUTH|authentication/i.test(msg)) {
    return {
      status: 503,
      error: 'فشل تسجيل الدخول لـ Gmail SMTP. تحقق من App Password في .env.',
      code: 'SMTP_AUTH_FAILED',
    }
  }
  if (/already registered|مسجّل بالفعل/i.test(msg)) {
    return { status: 409, error: 'هذا البريد مسجّل بالفعل في المنصة.', code: 'EMAIL_REGISTERED' }
  }
  if (/must be active|حسابك نشط/i.test(msg)) {
    return { status: 403, error: 'يجب أن يكون حسابك نشطاً لإرسال الدعوات.', code: 'ACCOUNT_INACTIVE' }
  }
  if (/Invalid email/i.test(msg)) {
    return { status: 400, error: 'البريد الإلكتروني غير صالح.', code: 'INVALID_EMAIL' }
  }
  if (/Daily invitation limit/i.test(msg)) {
    return { status: 429, error: 'وصلت للحد اليومي للدعوات.', code: 'DAILY_LIMIT' }
  }
  if (/Too many pending/i.test(msg)) {
    return { status: 429, error: 'لديك عدد كبير من الدعوات المعلّقة.', code: 'PENDING_LIMIT' }
  }

  return null
}
