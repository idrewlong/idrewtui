import { describe, expect, it } from 'vitest'
import { summarizeEvents, type GithubEvent } from '../../app/utils/github'

const login = 'idrewlong'
const now = Date.parse('2026-09-16T12:00:00Z')

function event(partial: Partial<GithubEvent> & Pick<GithubEvent, 'type' | 'created_at'>): GithubEvent {
  return {
    repo: { name: 'idrewlong/idrewtui' },
    payload: {},
    ...partial,
  }
}

describe('summarizeEvents', () => {
  it('marks a successful fetch as supported even with no events', () => {
    const activity = summarizeEvents([], login, now)
    expect(activity.supported).toBe(true)
    expect(activity.login).toBe(login)
    expect(activity.latest).toBeNull()
    expect(activity.counts).toEqual(Array(30).fill(0))
  })

  it('buckets public events into a 30-day series and keeps the newest push as latest', () => {
    const events: GithubEvent[] = [
      event({
        type: 'PushEvent',
        created_at: '2026-09-16T08:00:00Z',
        repo: { name: 'idrewlong/idrewtui' },
        payload: {
          commits: [
            { sha: 'aaa111', message: 'wip' },
            { sha: 'bbb222', message: 'feat: ranger panes\n\nmore' },
          ],
        },
      }),
      event({
        type: 'WatchEvent',
        created_at: '2026-09-15T08:00:00Z',
        repo: { name: 'other/repo' },
      }),
      event({
        type: 'PushEvent',
        created_at: '2026-08-01T08:00:00Z',
        payload: { commits: [{ sha: 'old', message: 'too old' }] },
      }),
    ]

    const activity = summarizeEvents(events, login, now)
    expect(activity.counts.reduce((a, b) => a + b, 0)).toBe(2)
    expect(activity.counts[29]).toBe(1)
    expect(activity.counts[28]).toBe(1)
    expect(activity.latest).toEqual({
      repo: 'idrewlong/idrewtui',
      message: 'feat: ranger panes',
      at: '2026-09-16T08:00:00Z',
      url: 'https://github.com/idrewlong/idrewtui/commit/bbb222',
    })
  })

  it('leaves latest empty when there is no push rather than inventing a commit', () => {
    const activity = summarizeEvents([
      event({ type: 'WatchEvent', created_at: '2026-09-16T08:00:00Z' }),
    ], login, now)
    expect(activity.latest).toBeNull()
    expect(activity.counts[29]).toBe(1)
  })
})
