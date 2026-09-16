/**
 * The four tabs, in order. Each is a real route so it can be linked, indexed,
 * and opened in a new tab (docs/PROJECT.md §3).
 */
export interface Tab {
  /** Numeric shortcut and the number shown in the tab bar. */
  key: '1' | '2' | '3' | '4'
  label: string
  to: string
  /** Shown in the status line, e.g. `~/experience`. */
  path: string
  /** The command echoed by the prompt line on that view. */
  command: string
}

export const tabs: Tab[] = [
  { key: '1', label: 'info', to: '/', path: '~', command: 'fastfetch' },
  { key: '2', label: 'experience', to: '/experience', path: '~/experience', command: 'git log --career' },
  { key: '3', label: 'projects', to: '/projects', path: '~/projects', command: 'ls -la ~/projects' },
  { key: '4', label: 'skills', to: '/skills', path: '~/skills', command: 'tree ~/skills' },
]
