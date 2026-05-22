import { DEMO_API_USER } from '../config/demoMode.js'

export const DEMO_AGENCIES = [
  {
    id: 'agency-1',
    slug: 'credo-elite',
    name: 'Credo Elite',
    tagline: 'وكالة قيادية للنمو المؤسسي',
    member_count: 128,
    rank_score: 94,
    logo_url: null,
    primary_color: '#7B6CF6',
  },
]

const DEMO_GAMIFICATION_HUB = {
  progress: {
    xp_global: 4200,
    xp_seasonal: 1200,
    xp_team: 800,
    xp_leadership: 400,
    level: 3,
    prestige_tier: 'silver',
    prestige_count: 0,
    streak_days: 7,
    equipped_title_key: null,
    equipped_frame_key: null,
    equipped_theme_key: null,
    profile_card_json: {},
  },
  level: {
    current: { level: 3, title_en: 'Silver Director', xp_required: 3000 },
    next: { level: 4, title_en: 'Gold Director', xp_required: 6000 },
    pct: 40,
    xpToNext: 1800,
  },
  prestige: {
    current: { tier_key: 'silver', title_en: 'Silver Prestige', sort_order: 1 },
    next: { tier_key: 'gold', title_en: 'Gold Prestige', sort_order: 2 },
  },
  season: { name: 'Season 2026', id: 'demo-season' },
  active_events: [],
  achievements: [
    {
      key: 'first_referral',
      title: 'First Referral',
      description: 'Invite your first member',
      icon: '🎯',
      rarity: 'common',
      category: 'team',
      unlocked: true,
      unlocked_at: new Date().toISOString(),
    },
  ],
  missions: [
    {
      id: 'm1',
      title: 'Share your invite link',
      description: 'Grow your network',
      icon: '🔗',
      rarity: 'common',
      current_count: 1,
      target_count: 3,
      is_completed: false,
      xp_reward: 50,
      pearl_reward: 10,
    },
  ],
  streaks: [
    {
      streak_key: 'daily_login',
      current_days: 7,
      longest_days: 14,
      game_streak_definitions: { label: 'Daily login' },
    },
  ],
  titles: [],
  cosmetics: [],
  boosters: [],
  pearls: { available_balance: 2840, tier: 'gold', current_streak: 14 },
  levels_catalog: [{ level: 1, xp_required: 0, title_en: 'Starter' }],
  prestige_catalog: [
    { tier_key: 'bronze', title_en: 'Bronze', sort_order: 0, min_level: 1, min_xp_global: 0 },
    { tier_key: 'silver', title_en: 'Silver', sort_order: 1, min_level: 2, min_xp_global: 2000 },
  ],
}

export const DEMO_DASHBOARD = {
  user: {
    id: DEMO_API_USER.id,
    user_code: DEMO_API_USER.user_code,
    username: DEMO_API_USER.username,
    full_name: DEMO_API_USER.full_name,
    rank: DEMO_API_USER.rank,
    total_pv: 420,
    direct_count: 12,
  },
  bv: { sideA: 9200, sideB: 8800 },
  nextRank: { name: 'Gold Director', matching_bv_required: 10000, pbv_required: 500, directs_required: 5 },
  snapshot: {
    sideA: { active: 24, inactive: 3, total: 27, direct: 12, unsettledBv: 9200 },
    sideB: { active: 22, inactive: 4, total: 26, direct: 12, unsettledBv: 8800 },
  },
  recentAmbassadors: [
    {
      username: 'member.demo',
      country: 'AE',
      joining_date: new Date().toISOString(),
      activation_date: new Date().toISOString(),
      status: 'active',
    },
  ],
  referralLinks: {
    sideA: '/register?ref=CW-DEMO&side=LEFT',
    sideB: '/register?ref=CW-DEMO&side=RIGHT',
    auto: '/register?ref=CW-DEMO&side=AUTO',
    customer: '/customer-register?ref=CW-DEMO',
  },
  wallets: { earnings: 3200, cmoney: 12450.5 },
  fastStart: { directCount: 12, directRequired: 3, bonusCycles: 4 },
  monthlyChart: [
    { month: 'Jan', count: 2 },
    { month: 'Feb', count: 4 },
    { month: 'Mar', count: 3 },
  ],
  notifications: [],
}

export function matchDemoRoute(path, method) {
  const m = (method || 'get').toLowerCase()
  const rules = [
    ['/auth/refresh', 'post', () => ({ accessToken: 'demo-access-token' })],
    ['/auth/me', 'get', () => ({ user: DEMO_API_USER })],
    ['/auth/login', 'post', () => ({ accessToken: 'demo-access-token', user: DEMO_API_USER })],
    ['/auth/logout', 'post', () => ({ ok: true })],
    ['/auth/register', 'post', () => ({
      message: 'تم إنشاء الحساب (وضع العرض)',
      status: 'active',
      user: DEMO_API_USER,
    })],
    ['/health/setup', 'get', () => ({
      ready: true,
      canWrite: true,
      ranksCount: 5,
      usersCount: 1,
      hasAdmin: true,
      isFirstUserSlot: false,
      usingPublishableKey: false,
      issues: [],
    })],
    ['/public/join/resolve', 'get', () => ({ ok: true, agency: null, sponsor: null, placementSide: null })],
    ['/dashboard', 'get', () => DEMO_DASHBOARD],
    ['/packages/my-status', 'get', () => ({ currentLevel: 3, currentSlots: 3, upgradePackage: null })],
    ['/packages', 'get', () => ({
      packages: [
        { id: 'p1', level: 1, name: 'أحادي', price: 99, slots: 1 },
        { id: 'p3', level: 3, name: 'ثلاثي', price: 249, slots: 3 },
        { id: 'p7', level: 7, name: 'سباعي', price: 499, slots: 7 },
      ],
      myStatus: { currentLevel: 3, currentSlots: 3 },
    })],
    ['/pearls/wallet', 'get', () => ({
      available_balance: 2840,
      tier: 'gold',
      current_streak: 14,
      lifetime_earned: 9200,
    })],
    ['/pearls', 'get', () => ({ items: [], rewards: [], missions: [], achievements: [] })],
    ['/agencies/mine', 'get', () => ({
      agency: DEMO_AGENCIES[0],
      membership: { role: 'member' },
      onboarding: {
        checklist: [
          { key: 'profile', done: true },
          { key: 'intro', done: true },
        ],
      },
    })],
    ['/agencies/discover', 'get', () => ({ agencies: DEMO_AGENCIES, items: DEMO_AGENCIES })],
    ['/agencies/leaderboard', 'get', () => ({ agencies: DEMO_AGENCIES, items: DEMO_AGENCIES })],
    ['/agencies/profile', 'get', () => ({
      agency: DEMO_AGENCIES[0],
      members: [],
      stats: { growth: 24 },
      achievements: [],
    })],
    ['/gamification/hub', 'get', () => DEMO_GAMIFICATION_HUB],
    ['/gamification/leaderboards/', 'get', () => ({ key: 'global_xp', period_key: 'all', entries: [] })],
    ['/gamification/leaderboards', 'get', () => [
      { key: 'global_xp', label: 'Global XP' },
      { key: 'team_growth', label: 'Team Growth' },
    ]],
    ['/progression/hub', 'get', () => DEMO_GAMIFICATION_HUB],
    ['/profile/hub', 'get', () => ({
      user: DEMO_API_USER,
      gamification: { xp: 4200, streak_days: 7, prestige: 1 },
      achievements: DEMO_GAMIFICATION_HUB.achievements,
      rankTimeline: [],
      wallets: { earnings: 3200, cmoney: 12450.5 },
    })],
    ['/profile', 'get', () => ({
      ...DEMO_API_USER,
      phone: '+201000000000',
      title: 'Mr',
      national_id: 'DEMO-ID',
    })],
    ['/wallet/summary', 'get', () => ({
      cmoney: { balance: 12450.5 },
      earnings: { balance: 3200 },
      transactions: [],
      monthlyIn: 5000,
      monthlyOut: 1200,
    })],
    ['/wallet/pin-status', 'get', () => ({ has_pin: false })],
    ['/shop/cart', 'get', () => ({ items: [], subtotal: 0 })],
    ['/notifications/sent', 'get', () => ({ messages: [], unreadRepliesTotal: 0 })],
    ['/notifications', 'get', () => ({ notifications: [], unreadCount: 0, total: 0 })],
    ['/support/unread', 'get', () => ({ count: 0 })],
    ['/support/my', 'get', () => []],
    ['/support/stats', 'get', () => ({ open: 0, resolved: 0 })],
    ['/organization/hub', 'get', () => ({
      agency: DEMO_AGENCIES[0],
      profile: {
        agencyXp: { level: 2, xp_total: 1200 },
        prestige: { tier: { title_ar: 'برونزي', title_en: 'Bronze' } },
        missions: [],
      },
      leaderboards: { recruiters: { entries: [] }, prestige: { entries: [] } },
    })],
    ['/organization/activity', 'get', () => ({ items: [] })],
    ['/tree/', 'get', () => ({
      access: { canView: true, locked: false },
      nodes: [],
      edges: [],
      activity: [],
      analytics: { members: 48, depth: 6 },
    })],
    ['/team/', 'get', () => ({ members: [], nodes: [], referrals: [], tree: { nodes: [], edges: [] } })],
    ['/mlm/', 'get', () => ({
      metrics: { pv: 420, bv_left: 9200, bv_right: 8800, bv_matching: 8800, cv: 100, gv: 200, tv: 300 },
      matching: { leftTotal: 9200, rightTotal: 8800, matched: 8800, newLeftCarry: 400, newRightCarry: 0, estimatedPayout: 1200 },
      summary: { balanceRatio: 96 },
    })],
    ['/wallet', 'get', () => ({ balance: 12450.5, items: [], transactions: [] })],
    ['/earnings', 'get', () => ({ balance: 12450.5, items: [], transactions: [] })],
    ['/courses', 'get', () => ({ courses: [], enrollments: [] })],
    ['/shop/products', 'get', () => ({ products: [], items: [] })],
    ['/shop/orders', 'get', () => ({ orders: [], items: [] })],
    ['/v3/finance/wallets', 'get', () => [
      { code: 'earnings', name: 'Earnings', balance: 3200, is_visible: true },
      { code: 'cmoney', name: 'C Money', balance: 12450.5, is_visible: true },
    ]],
    ['/finance/payment-methods', 'get', () => [
      { id: 'pm1', code: 'bank', name: 'Bank transfer', name_ar: 'تحويل بنكي', method_type: 'bank' },
    ]],
    ['/admin', 'get', () => ({ stats: {}, items: [], users: [], settings: {} })],
    ['/super-admin', 'get', () => ({ stats: {}, items: [], users: [], settings: {} })],
    ['/public/', 'get', () => ({ ok: true })],
  ]

  for (const [prefix, meth, handler] of rules) {
    if (m !== meth && meth !== '*') continue
    if (prefix.endsWith('/')) {
      if (path.includes(prefix)) return handler(path)
    } else if (path === prefix) {
      return handler(path)
    } else if (
      !['/packages', '/dashboard', '/notifications', '/wallet', '/pearls', '/gamification/leaderboards'].includes(
        prefix
      ) &&
      path.startsWith(`${prefix}/`)
    ) {
      return handler(path)
    }
  }
  return null
}
