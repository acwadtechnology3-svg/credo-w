import { motion } from 'framer-motion'
import SectionHeader from '../components/core/SectionHeader'
import Reveal from '../components/core/Reveal'

const LETTERS = ['C', 'R', 'E', 'D', 'O', 'W']

export default function WhyWSection() {
  return (
    <section className="ld-section" style={{ paddingBlock: 'clamp(100px, 15vw, 180px)' }}>
      <div className="ld-container" style={{ position: 'relative', textAlign: 'center' }}>
        {LETTERS.map((letter, i) => (
          <motion.span
            key={letter + i}
            aria-hidden
            style={{
              position: 'absolute',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 900,
              color: 'rgba(168,85,247,0.12)',
              fontFamily: 'var(--ld-font-display)',
              left: `${10 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{ y: [0, -20, 0], opacity: [0.08, 0.2, 0.08] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
          >
            {letter}
          </motion.span>
        ))}

        <Reveal>
          <div className="ld-glass" style={{ padding: 'clamp(48px, 8vw, 80px)', maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <SectionHeader
              eyebrow="لماذا W"
              title="عندما تلتقي الحروف… تبدأ القصة"
              titleEn="Why the W"
              subtitle="حرف W ليس زينة — هو محور الهوية: الوكالة، المحفظة، الشبكة، والانتصار."
              align="center"
            />
            <p className="ld-body" style={{ margin: '0 auto', textAlign: 'center' }}>
              ثلاثي الأبعاد، ضوء بنفسجي، ومعدن مصقول — كلها ترجمة بصرية لقوة العلامة في عالم الأعمال الرقمية.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
