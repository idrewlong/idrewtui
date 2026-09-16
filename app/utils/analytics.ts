/**
 * Every analytics event the site can send is declared here and goes out through
 * `track()`. Don't call the dataLayer directly and don't add an event without
 * adding it to `AnalyticsEvent` (CLAUDE.md "Analytics").
 *
 * The GTM/GA4 container itself is loaded after idle by `plugins/analytics.client.ts`,
 * so it never blocks rendering. Until it loads, pushes queue on the dataLayer.
 */

export type AnalyticsEvent =
  | { name: 'resume_download' }
  | { name: 'contact_click', channel: 'email' | 'linkedin' | 'github' }
  | { name: 'project_open', slug: string }
  | { name: 'tab_switch', tab: string }
  | { name: 'shortcut_used', key: string }

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function track(event: AnalyticsEvent): void {
  if (import.meta.server) return

  const { name, ...params } = event
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event: name, ...params })
}
