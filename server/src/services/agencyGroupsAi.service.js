/** Credo AI inside agency groups — rule-based assist */

const GROUP_FAQ = [
  {
    keys: ['باقة', 'package', 'ترقية', 'upgrade'],
    category: 'packages',
    text: 'الباقات تحدد مستوى عضويتك وعمولاتك. من **الباقات** قارن المستويات وفعّل الترقية بعد الدفع.',
  },
  {
    keys: ['مكافأة', 'reward', 'عمولة', 'commission'],
    category: 'rewards',
    text: 'المكافآت تشمل عمولات الشبكة، مكافآت الرتب، ولآلئ Credo. تتبعها من **الأرباح** و**ذكاء التعويضات**.',
  },
  {
    keys: ['انضمام', 'onboard', 'ترحيب', 'خطوات'],
    category: 'onboarding',
    text: 'رحلة الانضمام: أكمل ملف الوكالة → استكشف قنوات الإعلانات والقيادة → فعّل الباقة → انضم للشجرة.',
  },
  {
    keys: ['قائد', 'leader', 'راعي', 'sponsor'],
    category: 'leadership',
    text: 'الراعي يوجّهك في الشبكة. قناة **غرفة القيادة** للقادة فقط — للإعلانات استخدم قناة الإعلانات.',
  },
  {
    keys: ['حظر', 'ban', 'كتم', 'mute'],
    category: 'moderation',
    text: 'الإدارة قد تكتم أو تحظر عند مخالفة قواعد المجتمع. التحذيرات تُسجّل في سجل الإشراف.',
  },
]

function score(text, keys) {
  const t = (text || '').toLowerCase()
  return keys.reduce((s, k) => (t.includes(k.toLowerCase()) ? s + 2 : s), 0)
}

export function getGroupAiSuggestion(question) {
  const q = (question || '').trim()
  if (!q) {
    return {
      category: 'general',
      text: 'اسأل عن الباقات، المكافآت، خطوات الانضمام، أو قواعد المجتمع — أنا هنا لمساعدتك.',
    }
  }

  let best = null
  let bestScore = 0
  for (const item of GROUP_FAQ) {
    const s = score(q, item.keys)
    if (s > bestScore) {
      bestScore = s
      best = item
    }
  }

  if (best) return { category: best.category, text: best.text }

  return {
    category: 'general',
    text: 'شكراً لسؤالك. للتفاصيل الدقيقة تواصل مع قائد الوكالة في **غرفة القيادة** أو افتح تذكرة من **الدعم الفني**.',
  }
}
