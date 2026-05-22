import { asArray } from '../lib/safeData.js'

/**
 * Normalize API payloads so UI never calls .map/.filter on objects.
 * Safe for production (malformed responses) and demo mocks.
 */
export function normalizeApiPayload(path, method, data) {
  if (data == null) return data
  const p = (path || '/').replace(/^\/api/, '') || '/'
  const m = (method || 'get').toLowerCase()

  if (Array.isArray(data)) {
    if (p === '/gamification/leaderboards') return data
    if (p === '/support/my') return data
    return data
  }

  if (typeof data !== 'object') return data

  const out = { ...data }

  if (p === '/support/my' || (p === '/support' && m === 'get' && !/\/support\/[^/]+/.test(p))) {
    return asArray(data.tickets ?? data)
  }

  if (p.startsWith('/notifications')) {
    if (p.includes('/sent')) {
      out.messages = asArray(data.messages)
      out.unreadRepliesTotal = data.unreadRepliesTotal ?? data.unread ?? 0
      return out
    }
    out.notifications = asArray(data.notifications ?? data.items)
    out.unreadCount = data.unreadCount ?? data.unread ?? 0
    return out
  }

  if (p.includes('/shop/cart')) {
    out.items = asArray(data.items ?? data.cart?.items)
    return out
  }

  if (p === '/wallet/summary' || p.endsWith('/wallet/summary')) {
    out.transactions = asArray(data.transactions)
    return out
  }

  if (p.includes('/gamification/hub') || p.includes('/progression/hub')) {
    out.active_events = asArray(data.active_events)
    out.missions = asArray(data.missions)
    out.achievements = asArray(data.achievements)
    out.streaks = asArray(data.streaks)
    out.titles = asArray(data.titles)
    out.cosmetics = asArray(data.cosmetics)
    out.boosters = asArray(data.boosters)
    out.prestige_catalog = asArray(data.prestige_catalog)
    out.levels_catalog = asArray(data.levels_catalog)
    return out
  }

  if (p.includes('/organization/hub')) {
    if (out.profile) out.profile = { ...out.profile, missions: asArray(out.profile.missions) }
    if (out.leaderboards?.recruiters) {
      out.leaderboards.recruiters.entries = asArray(out.leaderboards.recruiters.entries)
    }
    return out
  }

  if (p.includes('/profile/hub')) {
    out.achievements = asArray(data.achievements)
    out.rankTimeline = asArray(data.rankTimeline ?? data.rank_timeline)
    return out
  }

  if (p === '/dashboard' || p.endsWith('/dashboard')) {
    out.recentAmbassadors = asArray(data.recentAmbassadors)
    out.notifications = asArray(data.notifications)
    if (data.monthlyChart != null) out.monthlyChart = asArray(data.monthlyChart)
    return out
  }

  if (p.includes('/agencies/mine')) {
    if (out.onboarding) out.onboarding = { ...out.onboarding, checklist: asArray(out.onboarding.checklist) }
    return out
  }

  if (p.includes('/support')) {
    out.tickets = asArray(data.tickets)
    out.messages = asArray(data.messages)
    return out
  }

  if (p.includes('/courses')) {
    out.courses = asArray(data.courses)
    out.enrollments = asArray(data.enrollments)
    return out
  }

  if (p.includes('/pearls') && !p.includes('/wallet')) {
    out.items = asArray(data.items)
    out.rewards = asArray(data.rewards)
    out.missions = asArray(data.missions)
    out.achievements = asArray(data.achievements)
    return out
  }

  if (p.includes('/v3/finance/wallets') || p === '/finance/wallets') {
    return asArray(data.wallets ?? data)
  }

  if (p.includes('/packages') && !p.includes('/my-status')) {
    out.packages = asArray(data.packages)
    return out
  }

  if (p.includes('/admin') || p.includes('/super-admin')) {
    out.items = asArray(data.items)
    out.users = asArray(data.users)
    return out
  }

  return out
}
