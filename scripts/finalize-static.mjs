/**
 * Nuxt writes `404.html` as an empty SPA fallback, which means a visitor who
 * hits a bad URL with JavaScript disabled gets a blank page and crawlers see no
 * title. `app/pages/404.vue` is prerendered with real content, so copy it over
 * the fallback.
 */
import { copyFile, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), '.output', 'public')
const source = join(dist, '404', 'index.html')
const target = join(dist, '404.html')

if (!existsSync(source)) {
  console.error(`[finalize-static] missing ${source} — is app/pages/404.vue prerendered?`)
  process.exit(1)
}

const html = await readFile(source, 'utf8')
if (!html.includes('<title>')) {
  console.error('[finalize-static] prerendered 404 has no <title>; refusing to publish it')
  process.exit(1)
}

await copyFile(source, target)
// Drop the /404 route itself so the page has exactly one canonical location.
await rm(join(dist, '404'), { recursive: true, force: true })

console.log('[finalize-static] 404.html written from the prerendered 404 page')
