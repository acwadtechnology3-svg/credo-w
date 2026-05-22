import { motion } from 'framer-motion'
import { Eye, Target, AlertTriangle, Orbit } from 'lucide-react'
import SectionShell from '../../landing/components/core/SectionShell'
import Reveal from '../../landing/components/core/Reveal'
import { staggerContainer, fadeUp } from '../../landing/motion/variants'
import usePrefersReducedMotion from '../../landing/hooks/usePrefersReducedMotion'

const ICONS = {
  vision: Eye,
  mission: Target,
  challenge: AlertTriangle,
  solution: Orbit,
}

const DEFAULT_CARDS = [
  {
    key: 'vision',
    title: 'الرؤية',
    text: 'بناء منظومة رقمية مترابطة تُعيد تعريف التوسع والقيادة في العصر الذكي عبر تقنيات حديثة وتجارب تنظيمية أكثر تطوراً.',
  },
  {
    key: 'mission',
    title: 'المهمة',
    text: 'تمكين الأفراد والوكالات من النمو داخل بيئة شفافة وذكية تجمع بين القيادة الرقمية والمكافآت والتوسع المستدام.',
  },
  {
    key: 'challenge',
    title: 'التحدي',
    text: 'معظم أنظمة التوسع التقليدية تفتقد للشفافية والأدوات الذكية وتجربة المستخدم الحديثة مما يحد من النمو الحقيقي.',
  },
  {
    key: 'solution',
    title: 'الحل',
    text: 'Credo W تقدم منظومة متكاملة تشمل الوكالات الرقمية والذكاء الاصطناعي والمحافظ والمكافآت وتجارب onboarding تفاعلية داخل نظام واحد.',
  },
]

function AmbientParticles({ count = 18 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className="eco-why-credo__particle"
          style={{
            left: `${8 + (i * 5.2) % 88}%`,
            top: `${12 + (i * 7.3) % 76}%`,
          }}
          animate={{
            y: [0, -14 - (i % 4) * 4, 0],
            opacity: [0.15, 0.45, 0.15],
          }}
          transition={{
            duration: 5 + (i % 5),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
    </>
  )
}

function SolutionParticles() {
  const dots = [
    { x: '12%', y: '18%', d: 0 },
    { x: '78%', y: '22%', d: 0.4 },
    { x: '84%', y: '68%', d: 0.8 },
    { x: '18%', y: '72%', d: 1.2 },
    { x: '50%', y: '8%', d: 0.6 },
    { x: '62%', y: '82%', d: 1 },
  ]
  return (
    <div className="eco-why-card__orbit" aria-hidden>
      {dots.map((dot, i) => (
        <motion.span
          key={i}
          className="eco-why-card__orbit-dot"
          style={{ left: dot.x, top: dot.y }}
          animate={{
            scale: [0.85, 1.15, 0.85],
            opacity: [0.35, 0.9, 0.35],
          }}
          transition={{
            duration: 3.2 + dot.d,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: dot.d,
          }}
        />
      ))}
    </div>
  )
}

function WhyCard({ card, index }) {
  const Icon = ICONS[card.key] || Eye
  const variant = card.key

  return (
    <motion.article
      className={`eco-why-card eco-why-card--${variant}`}
      variants={fadeUp}
      custom={index * 0.1}
      whileHover={
        variant === 'mission'
          ? { y: -10, scale: 1.02 }
          : { y: -6, transition: { duration: 0.35 } }
      }
    >
      {variant === 'solution' && <SolutionParticles />}
      <div className="eco-why-card__shine" aria-hidden />
      <div className={`eco-why-card__icon eco-why-card__icon--${variant}`}>
        <Icon size={22} strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="eco-why-card__title">{card.title}</h3>
      <p className="eco-why-card__text">{card.text}</p>
    </motion.article>
  )
}

export default function EcoWhyCredoSection({ section, id }) {
  const reduced = usePrefersReducedMotion()
  const cards = section.cards?.length ? section.cards : DEFAULT_CARDS

  return (
    <SectionShell id={id} glow="subtle" className="eco-why-credo">
      <div className="eco-why-credo__bg" aria-hidden>
        <motion.div
          className="eco-why-credo__orb eco-why-credo__orb--a"
          animate={reduced ? undefined : { x: [0, 24, 0], y: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="eco-why-credo__orb eco-why-credo__orb--b"
          animate={reduced ? undefined : { x: [0, -20, 0], y: [0, 14, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        {!reduced && <AmbientParticles />}
      </div>

      <div className="ld-container eco-why-credo__inner">
        <Reveal>
          <header className="eco-why-credo__header">
            {section.eyebrow && <p className="ld-eyebrow">{section.eyebrow}</p>}
            <h2 className="eco-why-credo__title">{section.title}</h2>
            {section.titleEn && <p className="ld-en-sub eco-why-credo__title-en">{section.titleEn}</p>}
            {section.subtitle && <p className="eco-why-credo__subtitle">{section.subtitle}</p>}
          </header>
        </Reveal>

        <motion.div
          className="eco-why-credo__grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {cards.map((card, i) => (
            <WhyCard key={card.key || card.title} card={card} index={i} />
          ))}
        </motion.div>
      </div>
    </SectionShell>
  )
}
