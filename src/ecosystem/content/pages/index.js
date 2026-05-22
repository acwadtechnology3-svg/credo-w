import { ecosystemPage } from './ecosystem'
import { agenciesPage } from './agencies'
import { packagesPage } from './packages'
import { partnersPage } from './partners'
import { aboutPage } from './about'
import { faqPage } from './faq'
import { aiPage } from './ai'
import { rewardsPage } from './rewards'
import { academyPage } from './academy'
import { communityPage } from './community'
import { supportPage } from './support'

export const ECOSYSTEM_PAGES = {
  ecosystem: ecosystemPage,
  agencies: agenciesPage,
  packages: packagesPage,
  partners: partnersPage,
  about: aboutPage,
  faq: faqPage,
  ai: aiPage,
  rewards: rewardsPage,
  academy: academyPage,
  community: communityPage,
  support: supportPage,
}

export function getEcosystemPage(pageId) {
  return ECOSYSTEM_PAGES[pageId] || null
}
