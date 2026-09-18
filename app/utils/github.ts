export interface GithubCommit {
  sha: string
  message: string
}

export interface GithubEvent {
  type: string
  created_at: string
  repo: { name: string }
  payload: {
    commits?: GithubCommit[]
  }
}

export interface GithubLatest {
  repo: string
  message: string
  at: string
  url: string
}

export interface GithubActivity {
  supported: boolean
  login: string
  fetchedAt: string | null
  latest: GithubLatest | null
  counts: number[]
}

const DAY_MS = 86_400_000
const WINDOW_DAYS = 30

export function emptyGithubActivity(login: string): GithubActivity {
  return {
    supported: false,
    login,
    fetchedAt: null,
    latest: null,
    counts: [],
  }
}

/**
 * Map GitHub public events onto a 30-day sparkline. Latest is the newest
 * PushEvent commit — Watch/Issues events count toward activity but are not
 * presented as commits.
 */
export function summarizeEvents(
  events: readonly GithubEvent[],
  login: string,
  now = Date.now(),
): GithubActivity {
  const counts = Array.from({ length: WINDOW_DAYS }, () => 0)
  let latest: GithubLatest | null = null

  for (const event of events) {
    const at = Date.parse(event.created_at)
    if (!Number.isFinite(at)) continue

    const daysAgo = Math.floor((now - at) / DAY_MS)
    if (daysAgo >= 0 && daysAgo < WINDOW_DAYS) {
      counts[WINDOW_DAYS - 1 - daysAgo]! += 1
    }

    if (latest || event.type !== 'PushEvent' || !event.payload.commits?.length) {
      continue
    }

    const commit = event.payload.commits[event.payload.commits.length - 1]!
    latest = {
      repo: event.repo.name,
      message: commit.message.split('\n')[0] ?? '',
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
