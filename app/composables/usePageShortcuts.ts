import { inject } from 'vue'
import type { ShortcutAction } from '~/composables/useKeybindings'

export type PageShortcutHandlers = Partial<Record<ShortcutAction, () => void>>

/**
 * Register the shortcuts that only apply to the current page's list (j/k,
 * Enter, f). The layout owns the single keydown listener and delegates to
 * whatever the active page registered.
 */
export function usePageShortcuts(handlers: PageShortcutHandlers) {
  const register = inject<((h: PageShortcutHandlers) => void) | null>('registerPageShortcuts', null)
  register?.(handlers)
}
