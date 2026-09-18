import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Every keyboard shortcut on the site is declared once, here. The same list
 * drives the handlers and the help overlay (CLAUDE.md "Keyboard").
 * Each shortcut must also have a visible click/tap equivalent in the UI.
 */

export type ShortcutAction =
  | 'tab:1'
  | 'tab:2'
  | 'tab:3'
  | 'tab:4'
  | 'tab:prev'
  | 'tab:next'
  | 'list:down'
  | 'list:up'
  | 'list:open'
  | 'scroll:top'
  | 'scroll:bottom'
  | 'projects:filter'
  | 'resume:open'
  | 'email:copy'
  | 'theme:toggle'
  | 'help:toggle'
  | 'overlay:close'
  | 'palette:open'
  | 'find:open'
  | 'find:next'
  | 'find:prev'
  | 'card:copy'
  | 'compose:open'

export type ShortcutGroup = 'navigation' | 'movement' | 'actions'

export interface Shortcut {
  /** Matched against `KeyboardEvent.key`, case-sensitive. */
  keys: string[]
  action: ShortcutAction
  /** Shown in the help overlay. */
  description: string
  /** Label shown in the help overlay, e.g. "1–4". */
  label: string
  group: ShortcutGroup
}

export const shortcuts: Shortcut[] = [
  { keys: ['1'], action: 'tab:1', label: '1', description: 'Go to info', group: 'navigation' },
  { keys: ['2'], action: 'tab:2', label: '2', description: 'Go to experience', group: 'navigation' },
  { keys: ['3'], action: 'tab:3', label: '3', description: 'Go to projects', group: 'navigation' },
  { keys: ['4'], action: 'tab:4', label: '4', description: 'Go to skills', group: 'navigation' },
  { keys: ['h'], action: 'tab:prev', label: 'h', description: 'Previous tab', group: 'navigation' },
  { keys: ['l'], action: 'tab:next', label: 'l', description: 'Next tab', group: 'navigation' },

  { keys: ['j'], action: 'list:down', label: 'j', description: 'Move selection down', group: 'movement' },
  { keys: ['k'], action: 'list:up', label: 'k', description: 'Move selection up', group: 'movement' },
  { keys: ['Enter'], action: 'list:open', label: 'Enter', description: 'Open or expand the selected row', group: 'movement' },
  { keys: ['g'], action: 'scroll:top', label: 'g', description: 'Jump to top', group: 'movement' },
  { keys: ['G'], action: 'scroll:bottom', label: 'G', description: 'Jump to bottom', group: 'movement' },
  { keys: ['n'], action: 'find:next', label: 'n', description: 'Next find match', group: 'movement' },
  { keys: ['N'], action: 'find:prev', label: 'N', description: 'Previous find match', group: 'movement' },

  { keys: ['f'], action: 'projects:filter', label: 'f', description: 'Cycle the project filter', group: 'actions' },
  { keys: ['r'], action: 'resume:open', label: 'r', description: 'Open the resume PDF', group: 'actions' },
  { keys: ['y'], action: 'email:copy', label: 'y', description: 'Copy email address', group: 'actions' },
  { keys: ['Y'], action: 'card:copy', label: 'Y', description: 'Copy recruiter card', group: 'actions' },
  { keys: ['m'], action: 'compose:open', label: 'm', description: 'Compose email', group: 'actions' },
  { keys: [':'], action: 'palette:open', label: ':', description: 'Command palette', group: 'actions' },
  { keys: ['/'], action: 'find:open', label: '/', description: 'Find in page', group: 'actions' },
  { keys: ['t'], action: 'theme:toggle', label: 't', description: 'Cycle theme', group: 'actions' },
  { keys: ['?'], action: 'help:toggle', label: '?', description: 'Show this help', group: 'actions' },
  { keys: ['Escape'], action: 'overlay:close', label: 'Esc', description: 'Close overlay or collapse', group: 'actions' },
]

export const shortcutGroupLabels: Record<ShortcutGroup, string> = {
  navigation: 'navigation',
  movement: 'movement',
  actions: 'actions',
}

/**
 * True when a key event must not be treated as a shortcut: typing in a field,
 * or a modifier chord that belongs to the browser or a screen reader.
 */
export function shouldIgnoreKeyEvent(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true
  if (event.isComposing) return true

  const target = event.target as HTMLElement | null
  if (!target) return false

  const tag = target.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true

  return false
}

/** Resolve a key event to an action, or null when nothing matches. */
export function resolveAction(
  event: KeyboardEvent,
  list: Shortcut[] = shortcuts,
): ShortcutAction | null {
  if (shouldIgnoreKeyEvent(event)) return null
  return list.find(s => s.keys.includes(event.key))?.action ?? null
}

export type ShortcutHandlers = Partial<Record<ShortcutAction, (event: KeyboardEvent) => void>>

/**
 * Bind the shortcut table to handlers for the lifetime of the calling component.
 * Only actions present in `handlers` do anything; the rest fall through to the
 * browser untouched.
 */
export function useKeybindings(handlers: ShortcutHandlers) {
  function onKeydown(event: KeyboardEvent) {
    const action = resolveAction(event)
    if (!action) return

    const handler = handlers[action]
    if (!handler) return

    event.preventDefault()
    handler(event)
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

  return { shortcuts }
}
