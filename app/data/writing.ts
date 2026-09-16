import { projects } from '~/data/projects'
import type { Project } from '~/types/content'

/**
 * Articles live in `projects.ts` under the `writing` category so the /projects
 * view can filter across one list. This is the newest-first view of them.
 */
export const writing: Project[] = projects
  .filter(p => p.category === 'writing')
  .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? ''))
