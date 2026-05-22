/** Coerce unknown API/i18n values to arrays — prevents .map/.filter crashes */
export function asArray(value, fallback = []) {
  if (Array.isArray(value)) return value
  if (value == null) return fallback
  if (typeof value === 'object') {
    const vals = Object.values(value)
    if (vals.length && vals.every((v) => v && typeof v === 'object')) return vals
  }
  return fallback
}

export function asRecord(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}

export function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function asNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
