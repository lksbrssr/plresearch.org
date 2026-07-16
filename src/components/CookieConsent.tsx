'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'

type Consent = 'granted' | 'denied'

const STORAGE_KEY = 'pl-ga-consent'
const REGION_COOKIE = 'pl-consent-region'
export const OPEN_SETTINGS_EVENT = 'pl:open-cookie-settings'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}

function readStoredConsent(): Consent | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

// Best-effort removal of GA's cookies when a visitor opts out.
function clearGaCookies() {
  try {
    const base = location.hostname.replace(/^www\./, '')
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim()
      if (name.startsWith('_ga')) {
        document.cookie = `${name}=; path=/; max-age=0`
        document.cookie = `${name}=; path=/; domain=.${base}; max-age=0`
      }
    })
  } catch {
    /* ignore */
  }
}

export default function CookieConsent({ gaId }: { gaId: string }) {
  const [ready, setReady] = useState(false)
  const [consentRequired, setConsentRequired] = useState(true)
  const [consent, setConsent] = useState<Consent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const region = readCookie(REGION_COOKIE)
    // Treat anything that isn't an explicit "open" as consent-required.
    const required = region !== 'open'
    const stored = readStoredConsent()

    setConsentRequired(required)
    setConsent(stored)
    // Auto-show the banner only where consent is legally required and no choice
    // has been made yet. Elsewhere the visitor can open it from the footer.
    setShowBanner(required && stored === null)
    setReady(true)

    const open = () => setShowBanner(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, open)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open)
  }, [])

  function choose(next: Consent) {
    const prev = consent
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    setConsent(next)
    setShowBanner(false)
    // If the visitor is withdrawing prior consent, purge cookies and reload so
    // the already-injected GA script stops collecting.
    if (next === 'denied' && prev === 'granted') {
      clearGaCookies()
      location.reload()
    }
  }

  // GA may load when:
  //  - consent-required region: only after an explicit "granted"
  //  - opt-out region: by default, unless the visitor explicitly opted out
  const mayLoadGA =
    ready && (consentRequired ? consent === 'granted' : consent !== 'denied')

  return (
    <>
      {mayLoadGA && <GoogleAnalytics gaId={gaId} />}

      {ready && showBanner && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-5 shadow-2xl"
        >
          <p className="m-0 text-[15px] font-semibold text-black">
            Analytics cookies
          </p>
          <p className="mt-1.5 mb-4 text-[13.5px] leading-relaxed text-gray-600">
            We&apos;d like to use Google Analytics to understand how this site is
            used. It sets cookies only if you agree. Nothing loads until you
            choose, and you can change your mind anytime via{' '}
            <span className="whitespace-nowrap font-medium">
              &ldquo;Cookie settings&rdquo;
            </span>{' '}
            in the footer.{' '}
            <a
              href="https://www.protocol.ai/legal/#privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:no-underline"
            >
              Privacy Policy
            </a>
            .
          </p>
          {/* Two equally prominent, one-click choices (GDPR: reject must be as
              easy as accept). */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => choose('denied')}
              className="w-full rounded-full border border-black/15 bg-gray-100 px-5 py-3 text-[14.5px] font-semibold text-black transition-colors hover:bg-gray-200"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => choose('granted')}
              className="w-full rounded-full bg-black px-5 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  )
}
