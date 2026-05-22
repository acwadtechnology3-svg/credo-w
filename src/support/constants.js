export const SUPPORT_CATEGORIES = [
  {
    id: 'technical',
    label: 'الدعم التقني',
    hint: 'تسجيل، دخول، أخطاء التطبيق',
    icon: 'settings',
    color: '#6366f1',
    priority: 'medium',
    starterMessages: [
      'لا أستطيع تسجيل الدخول إلى حسابي',
      'التطبيق يتوقف أو يظهر خطأ عند فتح صفحة معينة',
      'أحتاج مساعدة في إعدادات الحساب أو الأمان',
    ],
  },
  {
    id: 'financial',
    label: 'الدعم المالي',
    hint: 'محفظة، تحويلات، أرصدة',
    icon: 'wallet',
    color: '#22c55e',
    priority: 'high',
    starterMessages: [
      'رصيد المحفظة لا يتطابق مع العمليات',
      'تحويل C Money لم يصل للمستلم',
      'استفسار عن عمولة أو حركة مالية',
    ],
  },
  {
    id: 'agency',
    label: 'دعم الوكالات',
    hint: 'وكالة، فريق، صلاحيات',
    icon: 'team',
    color: '#06b6d4',
    priority: 'medium',
    starterMessages: [
      'أحتاج تفعيل أو تعديل بيانات الوكالة',
      'مشكلة في إضافة عضو للفريق أو الصلاحيات',
      'استفسار عن لوحة تحكم الوكالة',
    ],
  },
  {
    id: 'packages',
    label: 'مشاكل الباقات',
    hint: 'ترقية، تفعيل، حدود',
    icon: 'shop',
    color: '#a855f7',
    priority: 'medium',
    starterMessages: [
      'تم خصم المبلغ ولم تُفعَّل الباقة',
      'أريد ترقية باقتي أو معرفة الفرق بين الباقات',
      'حد العمولات أو المزايا لا يظهر بشكل صحيح',
    ],
  },
  {
    id: 'rewards',
    label: 'مشاكل المكافآت',
    hint: 'رتب، مكافآت، نقاط',
    icon: 'rank',
    color: '#f59e0b',
    priority: 'medium',
    starterMessages: [
      'مكافأة الرتبة لم تُضف إلى المحفظة',
      'النقاط أو شريط التقدم لا يتحدث',
      'استفسار عن شروط مكافأة معينة',
    ],
  },
  {
    id: 'withdrawal',
    label: 'مشاكل السحب',
    hint: 'طلب سحب، تأخير، رفض',
    icon: 'wallet',
    color: '#ef4444',
    priority: 'high',
    starterMessages: [
      'طلب السحب معلّق منذ أكثر من المدة المتوقعة',
      'تم رفض السحب وأريد معرفة السبب',
      'أحتاج تعديل بيانات السحب (حساب / محفظة)',
    ],
  },
  {
    id: 'kyc',
    label: 'التحقق من الهوية',
    hint: 'هوية، مستندات، موافقة',
    icon: 'team',
    color: '#ec4899',
    priority: 'high',
    starterMessages: [
      'رفعت المستندات ولم تُقبل بعد',
      'رسالة تطلب إعادة رفع الهوية أو تصحيح البيانات',
      'التحقق مطلوب لإتمام سحب أو عملية',
    ],
  },
  {
    id: 'reports',
    label: 'البلاغات والشكاوى',
    hint: 'إبلاغ، شكوى، مخالفة',
    icon: 'support',
    color: '#f97316',
    priority: 'high',
    starterMessages: [
      'أريد الإبلاغ عن سلوك أو حساب مخالف',
      'لدي شكوى على معاملة أو عضو',
      'متابعة بلاغ سابق برقم التذكرة',
    ],
  },
  {
    id: 'administration',
    label: 'التواصل مع الإدارة',
    hint: 'طلب رسمي، قرار، استثناء',
    icon: 'admin',
    color: '#8b5cf6',
    priority: 'critical',
    featured: true,
    starterMessages: [
      'أحتاج تواصل مباشر مع الإدارة بخصوص حسابي',
      'طلب مراجعة قرار أو استثناء من السياسة',
      'استفسار حساس يتطلب متابعة إدارية',
    ],
  },
  {
    id: 'credo_ai',
    label: 'مساعد Credo AI',
    hint: 'إجابة فورية قبل التصعيد',
    icon: 'support',
    color: '#c084fc',
    priority: 'low',
    featured: true,
    starterMessages: [
      'كيف أفعّل باقتي أو أرقّيها؟',
      'متى يصل السحب وما الشروط؟',
      'اشرح لي نظام العمولات والمكافآت',
    ],
  },
]

export function getCategoryById(id) {
  return SUPPORT_CATEGORIES.find((c) => c.id === id)
}

export const TICKET_STATUS = {
  open: { label: 'مفتوحة', color: '#f59e0b' },
  pending: { label: 'قيد الانتظار', color: '#94a3b8' },
  in_review: { label: 'قيد المراجعة', color: '#6366f1' },
  waiting_user: { label: 'بانتظار ردك', color: '#22d3ee' },
  in_progress: { label: 'جارية', color: '#378ADD' },
  resolved: { label: 'تم الحل', color: '#22c55e' },
  closed: { label: 'مغلقة', color: '#64748b' },
}

export const PRIORITY_LABELS = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  critical: 'حرجة',
}

export const CANNED_REPLIES = [
  'شكراً لتواصلك، نراجع طلبك الآن.',
  'تم استلام المستندات، سنرد خلال 24 ساعة.',
  'يرجى إرسال لقطة شاشة أو رقم العملية.',
  'تم حل المشكلة — أخبرنا إن احتجت المزيد.',
]
