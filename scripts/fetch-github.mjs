/**
 * Snapshot public GitHub events into app/data/github.json at generate time.
 * Failures leave the existing file (or write the unsupported stub) so a
 * rate-limit never fabricates a graph and never breaks the build.
 */
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const login = 'idrewlong'
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'github.json')
const DAY_MS = 86_400_000
const WINDOW_DAYS = 30

const stub = {
  supported: false,
  login,
  fetchedAt: null,
  latest: null,
  counts: [],
}

function summarize(events, now) {
  const counts = Array.from({ length: WINDOW_DAYS }, () => 0)
  let latest = null

  for (const event of events) {
    const at = Date.parse(event.created_at)
    if (!Number.isFinite(at)) continue

    const daysAgo = Math.floor((now - at) / DAY_MS)
    if (daysAgo >= 0 && daysAgo < WINDOW_DAYS) {
      counts[WINDOW_DAYS - 1 - daysAgo] += 1
    }

    if (latest || event.type !== 'PushEvent' || !event.payload?.commits?.length) {
      continue
    }

    const commit = event.payload.commits[event.payload.commits.length - 1]
    latest = {
      repo: event.repo.name,
      message: String(commit.message || '').split('\n')[0],
      at: event.created_at,
      url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
    }
  }

  return {
    supported: true,
    login,
    fetchedAt: new Date(now).toISOString(),
    latest,
    counts,
  }
}

try {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'idrewlong.com',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const response = await fetch(`https://api.github.com/users/${login}/events/public`, { headers })
  if (!response.ok) {
    throw new Error(`GitHub events ${response.status}`)
  }

  const events = await response.json()
  if (!Array.isArray(events)) {
    throw new Error('GitHub events payload was not a list')
  }

  const activity = summarize(events, Date.now())
  await writeFile(out, `${JSON.stringify(activity, null, 2)}\n`)
  const total = activity.counts.reduce((sum, n) => sum + n, 0)
  console.log(`[fetch-github] wrote ${out} (${total} public events in 30d)`)
}
catch (error) {
  const reason = error instanceof Error ? error.message : String(error)
  if (!existsSync(out)) {
    await writeFile(out, `${JSON.stringify(stub, null, 2)}\n`)
  }
  console.warn(`[fetch-github] ${reason}; keeping existing github.json`)
}
