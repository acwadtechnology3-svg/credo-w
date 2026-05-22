const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function requireUuid(field, source = 'body') {
  return (req, res, next) => {
    const value = req[source]?.[field]
    if (!value || !UUID_RE.test(String(value))) {
      return res.status(400).json({ error: `${field} غير صالح` })
    }
    next()
  }
}

export function requirePurchaseBody(req, res, next) {
  const { package_id, idempotency_key } = req.body || {}
  if (!package_id || !UUID_RE.test(String(package_id))) {
    return res.status(400).json({ success: false, error: 'package_id غير صالح' })
  }
  if (!idempotency_key || String(idempotency_key).length < 8) {
    return res.status(400).json({ success: false, error: 'idempotency_key مطلوب (8 أحرف على الأقل)' })
  }
  if (String(idempotency_key).length > 64) {
    return res.status(400).json({ success: false, error: 'idempotency_key طويل جداً' })
  }
  next()
}

export function requirePurchaseBodyV2(req, res, next) {
  const { package_id, checkout_session_id, idempotency_key } = req.body || {}
  if (!package_id || !UUID_RE.test(String(package_id))) {
    return res.status(400).json({ success: false, error: 'package_id غير صالح' })
  }
  if (!checkout_session_id || !UUID_RE.test(String(checkout_session_id))) {
    return res.status(400).json({ success: false, error: 'checkout_session_id غير صالح' })
  }
  if (!idempotency_key || String(idempotency_key).length < 8) {
    return res.status(400).json({ success: false, error: 'idempotency_key مطلوب' })
  }
  if (String(idempotency_key).length > 64) {
    return res.status(400).json({ success: false, error: 'idempotency_key طويل جداً' })
  }
  next()
}

export function requireUuidParam(param) {
  return (req, res, next) => {
    const value = req.params[param]
    if (!value || !UUID_RE.test(String(value))) {
      return res.status(400).json({ success: false, error: `${param} غير صالح` })
    }
    next()
  }
}
