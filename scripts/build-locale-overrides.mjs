/**
 * Builds scripts/i18n-locale-overrides.json from premium translations.
 * Run: node scripts/build-locale-overrides.mjs && node scripts/seed-i18n-locales.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'i18n-locale-overrides.json')

const fr = {
  common: {
    tagline: 'Au-delà des attentes',
    loading: 'Chargement…',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    close: 'Fermer',
    getStarted: 'Commencer votre parcours',
    login: 'Connexion',
    register: 'Créer un compte',
    welcomeBack: 'Bon retour',
    seo: {
      defaultTitle: 'Credo W — Au-delà des attentes',
      defaultDescription:
        'Plateforme d\'organisation digitale intelligente — agences actives, croissance institutionnelle et récompenses en un seul écosystème.',
    },
  },
  navbar: {
    ecosystem: 'Écosystème',
    agencies: 'Agences',
    packages: 'Forfaits',
    rewards: 'Récompenses',
    about: 'À propos',
    faq: 'FAQ',
    login: 'Connexion',
    register: 'Rejoindre',
  },
  landing: {
    hero: {
      eyebrow: 'Plateforme d\'organisation digitale · Nouvelle génération',
      lead: 'Infrastructure intelligente pour la croissance digitale — leadership, agences, expansion et récompenses en un écosystème.',
      sub: 'Pas un site web. Un mouvement d\'affaires digitales propulsé par l\'IA — pour les leaders qui construisent l\'avenir.',
      ctaStart: 'Commencer',
      ctaExplore: 'Explorer l\'écosystème',
    },
    cta: {
      title: 'Prêt à diriger la prochaine génération ?',
      subtitle: 'Rejoignez un écosystème conçu pour l\'échelle mondiale.',
      primary: 'Commencer',
      secondary: 'Parler à Credo AI',
    },
  },
  dashboard: {
    nav: {
      groups: { activity: 'Activité', finance: 'Finance', resources: 'Ressources', account: 'Compte' },
      items: {
        dashboard: 'Accueil',
        tree: 'Arbre réseau',
        packages: 'Forfaits & upgrades',
        wallet: 'Portefeuille & C Money',
        settings: 'Paramètres',
      },
      shop: { label: 'Boutique', subscriptions: 'Abonnements' },
    },
  },
  auth: {
    login: { title: 'Bon retour', subtitle: 'Entrez dans l\'écosystème Credo W', submit: 'Connexion' },
    register: { title: 'Rejoignez le mouvement', submit: 'Créer le compte' },
  },
}

const es = {
  common: {
    tagline: 'Más allá de lo esperado',
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    getStarted: 'Comienza tu recorrido',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    welcomeBack: 'Bienvenido de nuevo',
    seo: {
      defaultTitle: 'Credo W — Más allá de lo esperado',
      defaultDescription:
        'Plataforma de organización digital inteligente — agencias activas, crecimiento institucional y recompensas en un solo ecosistema.',
    },
  },
  navbar: {
    ecosystem: 'Ecosistema',
    agencies: 'Agencias',
    packages: 'Paquetes',
    rewards: 'Recompensas',
    login: 'Entrar',
    register: 'Unirse',
  },
  landing: {
    hero: {
      eyebrow: 'Plataforma de organización digital · Nueva generación',
      lead: 'Infraestructura inteligente para el crecimiento digital — liderazgo, agencias, expansión y recompensas en un ecosistema.',
      sub: 'No es un sitio web. Un movimiento de negocios digitales con IA — para líderes que construyen el futuro.',
      ctaStart: 'Comenzar',
      ctaExplore: 'Explorar el ecosistema',
    },
    cta: {
      title: '¿Listo para liderar la próxima generación?',
      subtitle: 'Únete a un ecosistema diseñado para escala global.',
      primary: 'Empezar ahora',
      secondary: 'Hablar con Credo AI',
    },
  },
  dashboard: {
    nav: {
      groups: { activity: 'Actividad', finance: 'Finanzas', resources: 'Recursos', account: 'Cuenta' },
      items: {
        dashboard: 'Inicio',
        tree: 'Árbol de red',
        packages: 'Paquetes y upgrades',
        wallet: 'Billetera y C Money',
        settings: 'Ajustes',
      },
      shop: { label: 'Tienda', subscriptions: 'Suscripciones' },
    },
  },
}

const fa = {
  common: {
    tagline: 'فراتر از انتظار',
    loading: 'در حال بارگذاری…',
    save: 'ذخیره',
    cancel: 'لغو',
    getStarted: 'سفر خود را آغاز کنید',
    login: 'ورود',
    register: 'ایجاد حساب',
    welcomeBack: 'خوش آمدید',
    seo: {
      defaultTitle: 'Credo W — فراتر از انتظار',
      defaultDescription:
        'پلتفرم سازمان دیجیتال هوشمند — آژانس‌های زنده، رشد سازمانی و پاداش در یک اکوسیستم.',
    },
  },
  navbar: {
    ecosystem: 'اکوسیستم',
    agencies: 'آژانس‌ها',
    packages: 'بسته‌ها',
    rewards: 'پاداش‌ها',
    login: 'ورود',
    register: 'عضویت',
  },
  landing: {
    hero: {
      eyebrow: 'پلتفرم سازمان دیجیتال · نسل بعد',
      lead: 'زیرساخت هوشمند برای رشد کسب‌وکار دیجیتال — رهبری، آژانس، گسترش و پاداش در یک اکوسیستم.',
      sub: 'یک وب‌سایت نیست. جنبشی از کسب‌وکار دیجیتال با هوش مصنوعی — برای رهبرانی که آینده می‌سازند.',
      ctaStart: 'شروع سفر',
      ctaExplore: 'کاوش اکوسیستم',
    },
    cta: {
      title: 'آماده رهبری نسل بعد هستید؟',
      subtitle: 'به اکوسیستمی بپیوندید که برای مقیاس جهانی ساخته شده است.',
      primary: 'همین حالا شروع کنید',
      secondary: 'گفتگو با Credo AI',
    },
  },
  dashboard: {
    nav: {
      groups: { activity: 'فعالیت', finance: 'مالی', resources: 'منابع', account: 'حساب' },
      items: {
        dashboard: 'خانه',
        tree: 'درخت شبکه',
        packages: 'بسته‌ها و ارتقا',
        wallet: 'کیف پول و C Money',
        settings: 'تنظیمات',
      },
      shop: { label: 'فروشگاه', subscriptions: 'اشتراک‌ها' },
    },
  },
}

const hi = {
  common: {
    tagline: 'अपेक्षाओं से परे',
    loading: 'लोड हो रहा है…',
    getStarted: 'अपनी यात्रा शुरू करें',
    login: 'साइन इन',
    register: 'खाता बनाएं',
    seo: {
      defaultTitle: 'Credo W — अपेक्षाओं से परे',
      defaultDescription:
        'बुद्धिमान डिजिटल संगठन प्लेटफ़ॉर्म — लाइव एजेंसियां, संस्थागत विकास और पुरस्कार एक इकोसिस्टम में।',
    },
  },
  navbar: { ecosystem: 'इकोसिस्टम', agencies: 'एजेंसियां', packages: 'पैकेज', rewards: 'पुरस्कार' },
  landing: {
    hero: {
      lead: 'डिजिटल विकास के लिए बुद्धिमान बुनियाद — नेतृत्व, एजेंसियां, विस्तार और पुरस्कार एक इकोसिस्टम में।',
      ctaStart: 'यात्रा शुरू करें',
      ctaExplore: 'इकोसिस्टम देखें',
    },
  },
}

const zh = {
  common: {
    tagline: '超越期待',
    loading: '加载中…',
    getStarted: '开启您的旅程',
    login: '登录',
    register: '创建账户',
    seo: {
      defaultTitle: 'Credo W — 超越期待',
      defaultDescription: '智能数字组织平台——实时机构、机构级增长与奖励，尽在一体生态。',
    },
  },
  navbar: { ecosystem: '生态系统', agencies: '机构', packages: '套餐', rewards: '奖励' },
  landing: {
    hero: {
      lead: '为数字增长打造的智能基础设施——领导力、机构、扩张与奖励，统一于一个生态。',
      ctaStart: '开始旅程',
      ctaExplore: '探索生态系统',
    },
  },
}

const nl = {
  common: {
    tagline: 'Beyond verwachting',
    loading: 'Laden…',
    getStarted: 'Start je reis',
    login: 'Inloggen',
    register: 'Account aanmaken',
    seo: {
      defaultTitle: 'Credo W — Beyond verwachting',
      defaultDescription:
        'Intelligent digitaal organisatieplatform — live agencies, institutionele groei en beloningen in één ecosysteem.',
    },
  },
  navbar: { ecosystem: 'Ecosysteem', agencies: 'Agencies', packages: 'Pakketten', rewards: 'Beloningen' },
  landing: {
    hero: {
      lead: 'Slimme infrastructuur voor digitale groei — leiderschap, agencies, expansie en beloningen in één ecosysteem.',
      ctaStart: 'Begin je reis',
      ctaExplore: 'Ontdek het ecosysteem',
    },
  },
}

fs.writeFileSync(OUT, JSON.stringify({ fr, es, fa, hi, zh, nl }, null, 2) + '\n')
console.log('Wrote', OUT)
