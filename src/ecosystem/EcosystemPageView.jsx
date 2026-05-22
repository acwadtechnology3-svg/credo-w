import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useLandingLocale } from '../landing/i18n/landingLocale'
import { getEcosystemPage } from './content/pages/index'
import {
  EcoPageHero,
  EcoSectionRenderer,
} from './components/EcoBlocks'

export default function EcosystemPageView({ pageId }) {
  const { dir } = useLandingLocale()
  const location = useLocation()
  const [faqSearch, setFaqSearch] = useState('')
  const page = getEcosystemPage(pageId)

  if (!page) {
    return (
      <main className="eco-main" dir={dir}>
        <p style={{ textAlign: 'center', padding: 80 }}>الصفحة غير موجودة.</p>
      </main>
    )
  }

  const isFaq = pageId === 'faq'

  return (
    <main className="eco-main" dir={dir}>
      <EcoPageHero hero={page.hero} dir={dir} />
      {isFaq && (
        <div className="eco-search-wrap">
          <Search size={18} />
          <input
            type="search"
            className="eco-search"
            placeholder="ابحث في الأسئلة..."
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            aria-label="بحث الأسئلة"
          />
          <a href="/ai" className="eco-search-ai">
            اسأل Credo AI
          </a>
        </div>
      )}
      {page.sections.map((section) => (
        <EcoSectionRenderer
          key={section.id || section.type}
          section={section}
          search={isFaq && section.type === 'faq' ? faqSearch : undefined}
        />
      ))}
      {location.hash && <span id={location.hash.replace('#', '')} className="eco-anchor" />}
    </main>
  )
}
