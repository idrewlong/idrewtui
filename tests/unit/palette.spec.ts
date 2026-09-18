import { describe, expect, it } from 'vitest'
import { paletteCatalog, filterCatalog } from '../../app/utils/palette'
import { tabs } from '../../app/data/navigation'
import { projects } from '../../app/data/projects'
import { experience } from '../../app/data/experience'
import { THEME_NAMES } from '../../app/composables/useTheme'

describe('paletteCatalog', () => {
  const items = paletteCatalog()

  it('includes every tab, project, role, shipped theme, and the documented actions', () => {
    for (const tab of tabs) {
      expect(items.some(i => i.id === `tab:${tab.key}`)).toBe(true)
    }
    for (const project of projects) {
      expect(items.some(i => i.id === `project:${project.slug}`)).toBe(true)
    }
    for (const role of experience) {
      expect(items.some(i => i.id === `role:${role.slug}`)).toBe(true)
    }
    for (const theme of THEME_NAMES) {
      expect(items.some(i => i.id === `theme:${theme}`)).toBe(true)
    }
    for (const action of ['resume', 'yank-email', 'yank-card', 'man', 'less', 'help', 'compose']) {
      expect(items.some(i => i.id === `action:${action}`)).toBe(true)
    }
  })

  it('groups rows as jump, actions, then themes', () => {
    expect([...new Set(items.map(i => i.group))]).toEqual(['jump', 'actions', 'themes'])
  })

  it('never invents a destination that is not in data', () => {
    const jump = items.filter(i => i.group === 'jump')
    expect(jump.length).toBe(tabs.length + projects.length + experience.length)
  })
})

describe('filterCatalog', () => {
  it('returns the full catalog grouped when the query is empty', () => {
    const groups = filterCatalog(paletteCatalog(), '')
    expect(groups.map(g => g.group)).toEqual(['jump', 'actions', 'themes'])
    expect(groups.every(g => g.items.length > 0)).toBe(true)
  })

  it('fuzzy-filters across label and keywords', () => {
    const groups = filterCatalog(paletteCatalog(), 'madg')
    const ids = groups.flatMap(g => g.items.map(i => i.id))
    expect(ids).toContain('project:madg')
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterCatalog(paletteCatalog(), 'zzzz-no-such')).toEqual([])
  })
})
