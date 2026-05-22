import { AnimatePresence, motion } from 'framer-motion'
import { useLocale } from '../../i18n/hooks/useLocale.js'

export default function LocaleTransition({ children }) {
  const { locale } = useLocale()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={locale}
        className="locale-transition-root"
        initial={{ opacity: 0.92 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.92 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: 'inherit' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
