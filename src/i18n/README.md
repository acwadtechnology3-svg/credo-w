# Credo W Internationalization

## Structure

```
src/i18n/
  config.js          # Languages, namespaces, storage keys
  index.js           # i18next init + lazy JSON loading
  locales/{lang}/    # common, navbar, landing, dashboard, …
  hooks/
    useLocale.js     # Language + RTL
    useFormat.js     # Intl number/currency/date
    useNavLabels.js  # Dashboard sidebar + headers
    useLandingCopy.js
```

## Default language

Arabic (`ar`). Persisted in `localStorage` key `credo-locale`.

## Usage

```jsx
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/hooks/useLocale'
import { useFormat } from '@/i18n/hooks/useFormat'

const { t } = useTranslation('dashboard')
const { dir, setLocale } = useLocale()
const { currency } = useFormat()
```

## Adding a language

1. Copy `locales/en/*.json` to `locales/{code}/`
2. Translate JSON (Arabic is source of truth)
3. Add entry to `LANGUAGES` in `config.js`
4. Run `node scripts/build-locale-overrides.mjs && node scripts/seed-i18n-locales.mjs` if using overrides

## Migrating a page

Replace hardcoded strings with `t('key')` and add keys to the appropriate namespace JSON under `locales/ar/` and `locales/en/`.
