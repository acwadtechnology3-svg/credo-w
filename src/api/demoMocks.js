import { DEMO_API_USER } from '../config/demoMode.js'

function pathOf(config) {
  const raw = config.url || ''
  const base = (config.baseURL || '').replace(/\/$/, '')
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname.replace(/^\/api/, '') || '/'
    } catch {
      return raw
    }
  }
  const joined = `${base}${raw}`.replace(/\/api/, '')
  return joined.startsWith('/') ? joined : `/${joined}`
}

const DEMO_AGENCIES = [
  {
    id: 'agency-1',
    slug: 'credo-elite',
    name: 'Credo Elite',
    tagline: 'وكالة قيادية للنمو المؤسسي',
    member_count: 128,
    rank_score: 94,
    logo_url: null,
  },
  {
    id: 'agency-2',
    slug: 'gulf-rise',
    name: 'Gulf Rise',
    tagline: 'توسّع إقليمي · عمولات ذكية',
    member_count: 86,
    rank_score: 88,
    logo_url: null,
  },
]

export function resolveDemoMock(config) {
  const path = pathOf(config)
  const method = (config.method || 'get').toLowerCase()

  if (path.includes('/auth/refresh')) {
    return { accessToken: 'demo-access-token' }
  }
  if (path.includes('/auth/me')) {
    return { user: DEMO_API_USER }
  }
  if (path.includes('/auth/login') && method === 'post') {
    return { accessToken: 'demo-access-token', user: DEMO_API_USER }
  }
  if (path.includes('/auth/logout')) {
    return { ok: true }
  }

  if (path === '/dashboard' || path.endsWith('/dashboard')) {
    return {
      wallet_balance: 12450.5,
      cycle_earnings: 3200,
      bv: { total: 18400, sideA: 9200, sideB: 8800 },
      pv: { personal: 420, team: 12800 },
      referrals: { direct: 12, total: 48 },
      nextRank: { name: 'Gold Director', matching_bv_required: 10000 },
      notifications: [],
      rank: DEMO_API_USER.rank,
    }
  }

  if (path.includes('/packages/my-status')) {
    return { currentLevel: 3, currentSlots: 3, upgradePackage: null }
  }
  if (path.includes('/packages')) {
    return {
      packages: [
        { id: 'p1', level: 1, name: 'أحادي', price: 99, slots: 1 },
        { id: 'p3', level: 3, name: 'ثلاثي', price: 249, slots: 3 },
        { id: 'p7', level: 7, name: 'سباعي', price: 499, slots: 7 },
      ],
      myStatus: { currentLevel: 3, currentSlots: 3 },
    }
  }

  if (path.includes('/pearls/wallet')) {
    return {
      available_balance: 2840,
      tier: 'gold',
      current_streak: 14,
      lifetime_earned: 9200,
    }
  }
  if (path.includes('/pearls')) {
    return { items: [], rewards: [], missions: [], achievements: [] }
  }

  if (path.includes('/agencies/mine')) {
    return {
      agency: DEMO_AGENCIES[0],
      membership: { role: 'member' },
      onboarding: { checklist: [{ key: 'profile', done: true }, { key: 'intro', done: true }] },
    }
  }
  if (path.includes('/agencies/discover') || path.includes('/agencies/leaderboard')) {
    return { agencies: DEMO_AGENCIES, items: DEMO_AGENCIES }
  }
  if (path.includes('/agencies/profile')) {
    return { agency: DEMO_AGENCIES[0], members: [], stats: { growth: 24 } }
  }
  if (path.includes('/agencies')) {
    return { agency: DEMO_AGENCIES[0], agencies: DEMO_AGENCIES }
  }

  if (path.includes('/gamification/hub') || path.includes('/progression')) {
    return {
      rank: DEMO_API_USER.rank,
      xp: 4200,
      next_rank_xp: 6000,
      streak: 7,
      badges: [],
      leaderboards: [],
    }
  }

  if (path.includes('/tree/')) {
    return {
      access: { canView: true, locked: false },
      nodes: [],
      edges: [],
      activity: [],
      analytics: { members: 48, depth: 6 },
    }
  }

  if (path.includes('/team/')) {
    return { members: [], nodes: [], referrals: [], tree: { nodes: [], edges: [] } }
  }

  if (path.includes('/wallet') || path.includes('/earnings')) {
    return { balance: 12450.5, items: [], transactions: [] }
  }

  if (path.includes('/notifications')) {
    return { items: [], unread: 0 }
  }

  if (path.includes('/support')) {
    return { tickets: [], messages: [], unread: 0 }
  }

  if (path.includes('/courses')) {
    return { courses: [], enrollments: [] }
  }

  if (path.includes('/shop') || path.includes('/products') || path.includes('/orders')) {
    return { products: [], items: [], orders: [], cart: { items: [] } }
  }

  if (path.includes('/admin') || path.includes('/super-admin')) {
    return { stats: {}, items: [], users: [], settings: {} }
  }

  if (path.includes('/public/')) {
    return { ok: true }
  }

  if (method === 'get') {
    return Array.isArray(config.mockAsArray) ? [] : {}
  }
  return { ok: true, success: true }
}
