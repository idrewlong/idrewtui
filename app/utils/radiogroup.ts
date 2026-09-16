import { wrapIndex } from '~/composables/useSelection'

/**
 * Pure: the index a `role="radiogroup"` should move to for a given key, or
 * `null` if the key is not part of the roving-tabindex pattern (including
 * Enter/Space/Tab, which must fall through to native button/focus behaviour).
 *
 * ArrowDown/ArrowRight move forward, ArrowUp/ArrowLeft move back, both
 * wrapping; Home/End jump to the ends. This mirrors how a native
 * `<input type="radio">` group behaves for a screen-reader user tabbing in
 * expecting exactly one stop plus arrow-key movement (WAI-ARIA radio pattern).
 */
export function radioGroupTarget(key: string, current: number, length: number): number | null {
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return wrapIndex(current, 1, length)
    case 'ArrowUp':
    case 'ArrowLeft':
      return wrapIndex(current, -1, length)
    case 'Home':
      return length > 0 ? 0 : null
    case 'End':
      return length > 0 ? length - 1 : null
    default:
      return null
  }
}
