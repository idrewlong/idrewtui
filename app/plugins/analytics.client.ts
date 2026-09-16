/**
 * Loads the GA4/GTM container after the page is idle so it never competes with
 * rendering (CLAUDE.md "Analytics"). Events themselves go through
 * `app/utils/analytics.ts`; queued pushes are picked up once the container loads.
 *
 * TODO(andrew): set NUXT_PUBLIC_GTM_ID (or switch to Cloudflare Web Analytics
 * for a cookieless setup — docs/PROJECT.md §8). With no id set, nothing loads
 * and `track()` just fills the dataLayer harmlessly.
 */
export default defineNuxtPlugin(() => {
  const id = useRuntimeConfig().public.gtmId
  if (!id) return

  const start = () => {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ 'gtm.start': Date.now(), 'event': 'gtm.js' })

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(String(id))}`
    document.head.appendChild(script)
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 4000 })
  }
  else {
    setTimeout(start, 2000)
  }
})
