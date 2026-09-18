import raw from './github.json'
import type { GithubActivity } from '~/utils/github'

/**
 * Build-time snapshot of public GitHub events. `scripts/fetch-github.mjs`
 * overwrites `github.json` before generate; until then the stub is
 * `supported: false` so the panel renders em-dashes instead of a fake graph.
 */
export const github: GithubActivity = raw
