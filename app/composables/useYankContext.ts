import { useState } from '#app'
import { projects } from '~/data/projects'
import { experience } from '~/data/experience'
import type { ExperienceEntry, Project } from '~/types/content'

export type YankExtra =
  | { type: 'project', slug: string }
  | { type: 'experience', slug: string }
  | null

export function useYankContext() {
  const extra = useState<YankExtra>('yank-extra', () => null)

  function setProject(slug: string) {
    extra.value = { type: 'project', slug }
  }

  function setRole(slug: string) {
    extra.value = { type: 'experience', slug }
  }

  function resolve(): { project?: Project, role?: ExperienceEntry } {
    if (extra.value?.type === 'project') {
      return { project: projects.find(p => p.slug === extra.value?.slug) }
    }
    if (extra.value?.type === 'experience') {
      return { role: experience.find(r => r.slug === extra.value?.slug) }
    }
    return {}
  }

  return { extra, setProject, setRole, resolve }
}
