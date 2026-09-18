import { tabs } from '~/data/navigation'
import { projects } from '~/data/projects'
import { experience } from '~/data/experience'
import { THEME_NAMES, type Theme } from '~/composables/useTheme'
import { rank } from '~/utils/fuzzy'

export type PaletteGroup = 'jump' | 'actions' | 'themes'

export type PaletteAction =
  | { kind: 'route', to: string, hash?: string }
  | { kind: 'resume' }
  | { kind: 'yank-email' }
  | { kind: 'yank-card' }
  | { kind: 'man' }
  | { kind: 'less' }
  | { kind: 'help' }
  | { kind: 'compose' }
  | { kind: 'theme', theme: Theme }

export interface PaletteItem {
  id: string
  group: PaletteGroup
  label: string
  keywords: string[]
  haystack: string
  action: PaletteAction
}

function item(
  id: string,
  group: PaletteGroup,
  label: string,
  keywords: string[],
  action: PaletteAction,
): PaletteItem {
  return {
    id,
    group,
    label,
    keywords,
    haystack: [label, ...keywords].join(' '),
    action,
  }
}

export function paletteCatalog(): PaletteItem[] {
  const jump: PaletteItem[] = [
    ...tabs.map(tab => item(
      `tab:${tab.key}`,
      'jump',
      `${tab.key} ${tab.label}`,
      [tab.path, tab.command, tab.to],
      { kind: 'route', to: tab.to },
    )),
    ...projects.map(project => item(
      `project:${project.slug}`,
      'jump',
      `projects/${project.name}`,
      [project.slug, project.summary, ...project.tags, project.category],
      { kind: 'route', to: '/projects', hash: project.slug },
    )),
    ...experience.map(role => item(
      `role:${role.slug}`,
      'jump',
      `experience/${role.title} · ${role.employer}`,
      [role.slug, role.employer, role.title, ...role.bullets],
      { kind: 'route', to: '/experience', hash: role.slug },
    )),
  ]

  const actions: PaletteItem[] = [
    item('action:resume', 'actions', 'resume', ['pdf', 'download', 'cv'], { kind: 'resume' }),
    item('action:yank-email', 'actions', 'yank email', ['copy', 'contact'], { kind: 'yank-email' }),
    item('action:yank-card', 'actions', 'yank recruiter card', ['copy', 'markdown'], { kind: 'yank-card' }),
    item('action:man', 'actions', 'man idrew', ['tldr', 'about'], { kind: 'man' }),
    item('action:less', 'actions', 'less ~/resume', ['pager', 'read'], { kind: 'less' }),
    item('action:help', 'actions', 'help', ['shortcuts', '?'], { kind: 'help' }),
    item('action:compose', 'actions', 'compose mail', ['mutt', 'aerc', 'write', 'contact'], { kind: 'compose' }),
  ]

  const themes: PaletteItem[] = THEME_NAMES.map(theme => item(
    `theme:${theme}`,
    'themes',
    `theme ${theme}`,
    [theme],
    { kind: 'theme', theme },
  ))

  return [...jump, ...actions, ...themes]
}

export interface PaletteGroupView {
  group: PaletteGroup
  items: PaletteItem[]
}

const GROUP_ORDER: PaletteGroup[] = ['jump', 'actions', 'themes']

export function filterCatalog(items: PaletteItem[], query: string): PaletteGroupView[] {
  const ranked = rank(items, query)
  return GROUP_ORDER
    .map(group => ({ group, items: ranked.filter(i => i.group === group) }))
    .filter(g => g.items.length > 0)
}
