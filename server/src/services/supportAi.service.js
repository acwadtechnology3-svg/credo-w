/** Rule-based Credo AI assist — instant answers before human escalation */

const FAQ = [
  {
    keys: ['باقة', 'package', 'ترقية', 'upgrade', 'اشتراك'],
    category: 'packages',
    answer:
      'الباقات في Credo W تحدد مستوى عضويتك وعمولاتك. من لوحة التحكم → الباقات يمكنك مقارنة المستويات والترقية. بعد الدفع تُفعَّل الباقة تلقائياً خلال دقائق.',
  },
  {
    keys: ['محفظة', 'wallet', 'c money', 'cmoney', 'رصيد'],
    category: 'financial',
    answer:
      'المحفظة الذكية تعرض أرصدة الأرباح و C Money واللآلئ. الأرباح تُسحب عبر قسم السحب بعد ربط حساب بنكي والتحقق من الهوية عند الحاجة.',
  },
  {
    keys: ['سحب', 'withdraw', 'تحويل', 'بنك'],
    category: 'withdrawal',
    answer:
      'طلبات السحب تُراجع من الإدارة المالية. تأكد من إكمال KYC وربط حساب بنكي صحيح. الحالة تظهر في صفحة السحب.',
  },
  {
    keys: ['وكالة', 'agency', 'انضمام', 'فريق'],
    category: 'agency',
    answer:
      'للانضمام لوكالة: اكتشف الوكالات من القائمة، أرسل طلب انضمام، وانتظر موافقة القائد. يمكنك أيضاً إنشاء وكالتك بعد استيفاء الشروط.',
  },
  {
    keys: ['مكافأة', 'reward', 'لآلئ', 'pearls', 'عمولة'],
    category: 'rewards',
    answer:
      'المكافآت تشمل عمولات الشبكة، مكافآت الرتب، ولآلئ Credo. تتبعها من قسم الأرباح والتقدم في لوحة التحكم.',
  },
  {
    keys: ['رتبة', 'rank', 'ترقية رتبة'],
    category: 'ranks',
    answer:
      'الرتب تُحسب من حجم الأعمال والنشاط. عند استيفاء الشروط تُرقّى تلقائياً وتظهر في ملفك ولوحة MLM.',
  },
  {
    keys: ['تسجيل', 'login', 'دخول', 'كلمة', 'password', 'حساب'],
    category: 'technical',
    answer:
      'استخدم اسم المستخدم أو البريد أو رقم الهاتف مع كلمة المرور. نسيت كلمة المرور؟ من صفحة تسجيل الدخول → استعادة. لحساب Google استخدم زر Google.',
  },
  {
    keys: ['onboard', 'بداية', 'خطوات', 'كيف أبدأ'],
    category: 'onboarding',
    answer:
      'ابدأ من /start: اختر الباقة، أكمل الدفع، فعّل الشجرة، وانضم لوكالة. مركز الدعم يرافقك في كل خطوة.',
  },
  {
    keys: ['kyc', 'هوية', 'تحقق', 'وثيقة'],
    category: 'kyc',
    answer:
      'التحقق من الهوية مطلوب للسحب والمعاملات الكبيرة. ارفع المستندات من الملف الشخصي → التحقق، وانتظر مراجعة الإدارة.',
  },
]

function scoreMatch(text, keys) {
  const lower = text.toLowerCase()
  let score = 0
  for (const k of keys) {
    if (lower.includes(k.toLowerCase())) score += 2
  }
  return score
}

export function getAiSuggestion(message, category) {
  const text = `${message || ''} ${category || ''}`.trim()
  if (!text || text.length < 3) {
    return {
      resolved: false,
      answer: null,
      confidence: 0,
      suggestions: FAQ.slice(0, 4).map((f) => f.answer.slice(0, 80) + '…'),
    }
  }

  let best = null
  let bestScore = 0
  for (const entry of FAQ) {
    const s = scoreMatch(text, entry.keys)
    if (category && entry.category === category) s += 3
    if (s > bestScore) {
      bestScore = s
      best = entry
    }
  }

  if (best && bestScore >= 2) {
    return {
      resolved: bestScore >= 4,
      answer: best.answer,
      confidence: Math.min(0.95, bestScore / 8),
      category: best.category,
      suggestions: [],
    }
  }

  return {
    resolved: false,
    answer:
      'لم أجد إجابة دقيقة بعد. يمكنني ربطك بفريق الدعم — اضغط "تصعيد للإدارة" وسيرد مختص خلال ساعات العمل.',
    confidence: 0.2,
    suggestions: FAQ.slice(0, 3).map((f) => f.answer.slice(0, 60) + '…'),
  }
}
