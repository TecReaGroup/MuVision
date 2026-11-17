// NOTE: must load before App so component CSS (e.g. Video.js skin's `video { height: 100% }`) overrides
// Tailwind preflight's `video { height: auto }` within the shared `base` layer
import './app/global.css'
// Self-hosted so the browser never reaches a third-party font CDN
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/600.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { AppSkeleton } from './app/AppSkeleton'
import { I18nProvider } from './shared/i18n/I18nProvider'
import { CatalogProvider } from './feature/catalog/CatalogProvider'
import { AuthGate } from './feature/auth/AuthGate'
import { keepAppUpToDate } from './feature/pwa/appUpdate'

keepAppUpToDate()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthGate fallback={<AppSkeleton />}>
        <CatalogProvider fallback={<AppSkeleton />}>
          <App />
        </CatalogProvider>
      </AuthGate>
    </I18nProvider>
  </React.StrictMode>,
)
