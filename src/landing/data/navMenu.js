import {
  Bot,
  BarChart3,
  Package,
  Users,
  Compass,
  GraduationCap,
  Gem,
  LifeBuoy,
  Handshake,
  HelpCircle,
  Network,
  GitBranch,
  Award,
  Sparkles,
  Heart,
  Globe,
  Phone,
  Lightbulb,
  Rocket,
  Shield,
  Wallet,
  MessageCircle,
  Layers,
  ArrowUpCircle,
  Scale,
  CheckCircle2,
  Building2,
  UserPlus,
} from 'lucide-react'

const t = (ar, en) => ({ ar, en })

const item = (icon, titleAr, titleEn, subAr, subEn, href, opts = {}) => ({
  icon,
  title: t(titleAr, titleEn),
  subtitle: t(subAr, subEn),
  href,
  badge: opts.badge || null,
})

const aiPanel = (ctx, locale) => {
  const l = locale === 'en' ? 'en' : 'ar'
  const panels = {
    ecosystem: {
      tag: t('مرشد المنظومة', 'Ecosystem guide'),
      title: t('اسأل Credo AI', 'Ask Credo AI'),
      desc: t('دليل ذكي يشرح المنظومة خطوة بخطوة — بلغتك.', 'Smart guide explaining the ecosystem step by step.'),
      prompts: [
        t('ما هي رحلة الانضمام؟', 'What is the join journey?'),
        t('اشرح طبقات النمو', 'Explain growth layers'),
        t('كيف تعمل المكافآت؟', 'How do rewards work?'),
      ],
      cta: t('افتح Credo AI', 'Open Credo AI'),
      href: '/ai',
    },
    agencies: {
      tag: t('توسع الوكالات', 'Agency expansion'),
      title: t('اسأل عن الوكالات', 'Ask about agencies'),
      desc: t('افهم نموذج التوسع والقيادة دون تعقيد.', 'Understand expansion and leadership models clearly.'),
      prompts: [
        t('كيف أبدأ وكالة؟', 'How do I start an agency?'),
        t('ما هو نظام الرعاية؟', 'What is sponsorship?'),
      ],
      cta: t('استكشف الوكالات', 'Explore agencies'),
      href: '/agencies',
    },
    packages: {
      tag: t('مسار الدخول', 'Entry path'),
      title: t('اختر طبقتك', 'Choose your tier'),
      desc: t('الباقات جاهزية للتوسع — ليست شراءً عشوائيًا.', 'Packages are expansion readiness, not impulse checkout.'),
      prompts: [t('الفرق بين 1 و 3 و 7', 'Difference between 1, 3 & 7')],
      cta: t('قارن الباقات', 'Compare plans'),
      href: '/packages',
    },
    about: {
      tag: t('الرؤية', 'Vision'),
      title: t('لماذا Credo W؟', 'Why Credo W?'),
      desc: t('اكتشف الحركة والثقافة وراء المنظومة.', 'Discover the movement behind the platform.'),
      prompts: [t('ما رؤية كريدو؟', 'What is Credo vision?')],
      cta: t('اقرأ قصتنا', 'Read our story'),
      href: '/about',
    },
    faq: {
      tag: t('شفافية', 'Transparency'),
      title: t('أسئلة شائعة', 'Common questions'),
      desc: t('إجابات واضحة تبني الثقة قبل الانضمام.', 'Clear answers before you join.'),
      prompts: [t('كيف يعمل الدفع؟', 'How do payments work?')],
      cta: t('مركز المساعدة', 'Help center'),
      href: '/faq',
    },
  }
  const p = panels[ctx]
  if (!p) return null
  const localize = (o) => (o?.ar ? o[l] : o)
  return {
    ...p,
    tag: localize(p.tag),
    title: localize(p.title),
    desc: localize(p.desc),
    prompts: p.prompts.map(localize),
    cta: localize(p.cta),
    href: p.href,
  }
}

export function buildMenus(locale) {
  const l = locale === 'en' ? 'en' : 'ar'
  const loc = (o) => (o?.ar ? o[l] : o)

  const ecosystem = {
    id: 'ecosystem',
    label: t('المنظومة', 'Ecosystem'),
    badge: 'new',
    variant: 'hub',
    hubIntro: {
      title: t('استكشف المنظومة', 'Explore the ecosystem'),
      subtitle: t(
        'بوابة دخول — ذكاء، نمو، تعلّم، مكافآت، ومجتمع في قصة واحدة.',
        'Your gateway — intelligence, growth, learning, rewards, community.'
      ),
    },
    groups: [
      {
        label: t('الذكاء والإرشاد', 'Intelligence'),
        items: [
          item(Bot, 'Credo AI', 'Credo AI', 'مرشد onboarding ذكي', 'Smart onboarding guide', '/ai', { badge: 'new' }),
          item(MessageCircle, 'جولة المنظومة', 'Ecosystem tour', 'انضمام → باقة → وكالة → مكافآت', 'Join → package → agency → rewards', '/ecosystem'),
          item(Sparkles, 'مرشد قيادة', 'Leadership mentor', 'قرارات توسع أوضح', 'Clearer expansion decisions', '/ai'),
        ],
      },
      {
        label: t('النمو والتحليلات', 'Growth & analytics'),
        items: [
          item(BarChart3, 'Growth Analytics', 'Growth Analytics', 'مؤشرات حية', 'Live metrics', '/ecosystem#map'),
          item(Network, 'اقتصاد التوسع', 'Expansion economy', 'PV · BV · CV', 'Volume & conversion', '/ecosystem#economy'),
          item(ArrowUpCircle, 'المكافآت', 'Rewards', 'عمولات ورتب', 'Commissions & ranks', '/rewards'),
        ],
      },
      {
        label: t('المسارات والمجتمع', 'Paths & community'),
        items: [
          item(Package, 'الباقات', 'Packages', 'مسارات دخول 1 · 3 · 7', 'Entry paths 1 · 3 · 7', '/packages'),
          item(Users, 'المجتمع', 'Community', 'أحداث وقصص نجاح', 'Events & success stories', '/community'),
          item(Compass, 'ابدأ الآن', 'Start now', 'مرشد خطوة بخطوة', 'Step-by-step wizard', '/start'),
        ],
      },
      {
        label: t('التعلّم والدعم', 'Learn & support'),
        items: [
          item(GraduationCap, 'الأكاديمية', 'Academy', 'قيادة وتوسع رقمي', 'Leadership & expansion', '/academy'),
          item(Gem, 'نظام المكافآت', 'Rewards system', 'طبقات إنجاز', 'Achievement layers', '/rewards'),
          item(LifeBuoy, 'الدعم', 'Support', 'onboarding ووكالات', 'Onboarding & agencies', '/support'),
        ],
      },
    ],
    aiPanel: aiPanel('ecosystem', locale),
  }

  const agencies = {
    id: 'agencies',
    label: t('الوكالات', 'Agencies'),
    variant: 'hub',
    hubIntro: {
      title: t('منظومة الوكالات', 'Agency ecosystem'),
      subtitle: t(
        'وحدات توسع رقمية — قيادة ومجتمعات نمو قابلة للتوسع.',
        'Digital expansion units — leadership & scalable communities.'
      ),
    },
    groups: [
      {
        label: t('ابدأ التوسع', 'Start expanding'),
        items: [
          item(Handshake, 'كن شريك توسع', 'Become a partner', 'ابنِ منظمتك', 'Build your organization', '/partners'),
          item(Rocket, 'استكشف الوكالات', 'Explore agencies', 'نماذج وقصص نمو', 'Models & growth stories', '/agencies'),
          item(UserPlus, 'انضم لوكالة', 'Join agency', 'بعد إنشاء الحساب', 'After account setup', '/agencies#apply'),
        ],
      },
      {
        label: t('افهم النموذج', 'Understand the model'),
        items: [
          item(HelpCircle, 'أسئلة الوكالات', 'Agency FAQ', 'رعاية وتوسع', 'Sponsorship & expansion', '/faq'),
          item(Layers, 'نماذج الوكالات', 'Agency models', 'مؤسس · إقليمي · قيادة', 'Founder · regional · leadership', '/agencies#types'),
          item(GitBranch, 'بنية التوسع', 'Expansion structure', 'رعاية · placement · قيادة', 'Sponsor · placement · leadership', '/agencies#structure'),
        ],
      },
      {
        label: t('المكافآت', 'Rewards'),
        items: [
          item(Award, 'مكافآت الوكالة', 'Agency rewards', 'حوافز قيادة', 'Leadership incentives', '/rewards'),
          item(BarChart3, 'أداء المنظمة', 'Org performance', 'مؤشرات شفافة', 'Transparent metrics', '/ecosystem#economy', { badge: 'new' }),
        ],
      },
    ],
    aiPanel: aiPanel('agencies', locale),
  }

  const packages = {
    id: 'packages',
    label: t('الباقات', 'Packages'),
    variant: 'hub',
    hubIntro: {
      title: t('مسارات الدخول', 'Entry paths'),
      subtitle: t('طبقات وصول — جاهزية للتوسع.', 'Access layers — expansion readiness.'),
    },
    groups: [
      {
        label: t('طبقات الدخول', 'Entry tiers'),
        items: [
          item(Package, 'أحادي · 1', 'Single · 1', 'دخول شخصي', 'Personal entry', '/packages'),
          item(Layers, 'ثلاثي · 3', 'Triple · 3', 'بداية قيادة', 'Leadership start', '/packages', { badge: 'new' }),
          item(Rocket, 'سباعي · 7', 'Seven · 7', 'وصول كامل', 'Full access', '/packages'),
        ],
      },
      {
        label: t('قارن وارتقِ', 'Compare & upgrade'),
        items: [
          item(Scale, 'قارن الخطط', 'Compare plans', 'مزايا ومكافآت', 'Features & rewards', '/packages#compare'),
          item(ArrowUpCircle, 'رحلة 1 → 3 → 7', 'Upgrade journey', 'تقدم طبيعي', 'Natural progression', '/packages'),
          item(CheckCircle2, 'المحافظ', 'Wallets', 'C Money والأرباح', 'C Money & earnings', '/packages#wallet'),
        ],
      },
    ],
    tiers: [
      { num: '1', label: t('فردي', 'Solo'), en: 'Starter' },
      { num: '3', label: t('ثلاثي', 'Triple'), en: 'Leader' },
      { num: '7', label: t('سباعي', 'Seven'), en: 'Elite' },
    ],
    aiPanel: aiPanel('packages', locale),
  }

  const about = {
    id: 'about',
    label: t('حول كريدو', 'About'),
    variant: 'hub',
    hubIntro: {
      title: t('الحركة والرؤية', 'Movement & vision'),
      subtitle: t('ثقة · ثقافة · مستقبل التوسع الذكي.', 'Trust · culture · intelligent expansion.'),
    },
    groups: [
      {
        label: t('القصة', 'Story'),
        items: [
          item(Sparkles, 'رؤيتنا', 'Our vision', 'منظمات رقمية ذكية', 'AI-powered organizations', '/about'),
          item(Heart, 'تغيير الحياة', 'Changing lives', 'قيادة وتمكين', 'Leadership & empowerment', '/about'),
          item(Lightbulb, 'لماذا Credo W', 'Why Credo W', 'بنية ذكية حديثة', 'Modern intelligent infra', '/about'),
        ],
      },
      {
        label: t('المجتمع', 'Community'),
        items: [
          item(Globe, 'مجتمع وأحداث', 'Community & events', 'لقاءات رقمية', 'Digital gatherings', '/community'),
          item(Rocket, 'مستقبل التوسع', 'Future of expansion', 'منظمات قابلة للتوسع', 'Scalable organizations', '/about'),
          item(Phone, 'تواصل', 'Contact', 'شراكات ووكالات', 'Partnerships & agencies', '/support'),
        ],
      },
    ],
    aiPanel: aiPanel('about', locale),
  }

  const faq = {
    id: 'faq',
    label: t('الأسئلة', 'FAQ'),
    variant: 'list',
    hubIntro: {
      title: t('شفافية وثقة', 'Transparency'),
      subtitle: t('إجابات قبل أن تبدأ.', 'Answers before you begin.'),
    },
    items: [
      item(HelpCircle, 'أسئلة المنظومة', 'Ecosystem', 'ما هو Credo W؟', 'What is Credo W?', '/faq'),
      item(Building2, 'الوكالات', 'Agencies', 'رعاية وانضمام', 'Sponsorship & joining', '/faq'),
      item(Wallet, 'المحافظ', 'Wallets', 'C Money وسحب', 'C Money & payouts', '/faq'),
      item(Bot, 'Credo AI', 'Credo AI', 'إرشاد بلغتك', 'Guidance in your language', '/ai'),
      item(Shield, 'الأمان', 'Security', 'هوية ومدفوعات', 'Identity & payments', '/faq'),
    ],
    aiPanel: aiPanel('faq', locale),
  }

  const localizeMenu = (menu) => ({
    ...menu,
    label: loc(menu.label),
    hubIntro: menu.hubIntro
      ? { title: loc(menu.hubIntro.title), subtitle: loc(menu.hubIntro.subtitle) }
      : undefined,
    groups: menu.groups?.map((g) => ({
      label: loc(g.label),
      items: g.items.map((it) => ({
        ...it,
        title: loc(it.title),
        subtitle: loc(it.subtitle),
      })),
    })),
    tiers: menu.tiers?.map((tier) => ({
      ...tier,
      label: loc(tier.label),
      en: tier.en,
    })),
    items: menu.items?.map((it) => ({
      ...it,
      title: loc(it.title),
      subtitle: loc(it.subtitle),
    })),
    aiPanel: menu.aiPanel,
  })

  return [ecosystem, agencies, packages, about, faq].map(localizeMenu)
}

export function getNavCopyLegacy(locale) {
  const l = locale === 'en' ? 'en' : 'ar'
  const pick = (o) => o[l]
  return {
    new: pick(t('جديد', 'New')),
    login: pick(t('دخول', 'Log in')),
    start: pick(t('ابدأ الآن', 'Get started')),
    dashboard: pick(t('لوحة التحكم', 'Dashboard')),
    explore: pick(t('استكشف', 'Explore')),
    menuTitle: pick(t('بوابة المنظومة', 'Ecosystem gate')),
    loginHint: pick(t('لديك حساب؟', 'Have an account?')),
  }
}

/** @deprecated Use useNavMenus hook */
export function getNavCopy(locale) {
  return getNavCopyLegacy(locale === 'en' ? 'en' : 'ar')
}

/** @deprecated Use useNavMenus hook */
export function getNavMenus(locale) {
  const l = locale === 'ar' || locale === 'fa' ? 'ar' : 'en'
  return {
    copy: getNavCopyLegacy(l),
    menus: buildMenus(l),
  }
}
