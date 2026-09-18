import { computed } from 'vue'
import { useState } from '#app'
import {
  overlayModeLabel,
  type OverlayMode,
  type PagerKind,
} from '~/utils/overlay'

/**
 * Exclusive overlay mode for the shell. Opening one tool closes the others.
 * Shared via `useState` so the status line, keybindings, and dialogs agree.
 */
export function useOverlay() {
  const mode = useState<OverlayMode>('overlay-mode', () => 'normal')
  const pager = useState<PagerKind>('overlay-pager', () => 'man')

  function open(next: OverlayMode, kind?: PagerKind) {
    if (kind) pager.value = kind
    mode.value = next
  }

  function close() {
    mode.value = 'normal'
  }

  function toggle(next: OverlayMode, kind?: PagerKind) {
    const sameKind = !kind || pager.value === kind
    if (mode.value === next && sameKind) {
      close()
      return
    }
    open(next, kind)
  }

  return {
    mode,
    pager,
    open,
    close,
    toggle,
    label: computed(() => overlayModeLabel(mode.value)),
  }
}
