import { tabs } from '~~/app/data/navigation'

/**
 * Small enough to generate by hand — the site has four routes and no CMS, so a
 * sitemap module would be a dependency for a dozen lines of XML. Prerendered at
 * build time (see nitro.prerender.routes) and kept in sync with the tab list.
 */
export default defineEventHandler((event) => {
  const base = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')
  const lastmod = new Date().toISOString().slice(0, 10)

  const urls = tabs.map(tab => `  <url>
    <loc>${base}${tab.to}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${tab.to === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
})
