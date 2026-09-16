import { computed, ref, watch, type Ref } from 'vue'

/** Pure: next index with wraparound. Returns 0 for an empty list. */
export function wrapIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0
  return (current + delta + length) % length
}

/**
 * j/k list selection. The selected row is also focused so keyboard and mouse
 * users share one notion of "current row", and screen readers follow along.
 */
export function useSelection(length: Ref<number> | (() => number)) {
  const size = typeof length === 'function' ? computed(length) : length
  const index = ref(0)

  // Keep the selection in range when a filter shrinks the list.
  watch(size, (n) => {
    if (index.value > n - 1) index.value = Math.max(0, n - 1)
  })

  function move(delta: number) {
    index.value = wrapIndex(index.value, delta, size.value)
  }

  return {
    index,
    move,
    down: () => move(1),
    up: () => move(-1),
    first: () => { index.value = 0 },
    last: () => { index.value = Math.max(0, size.value - 1) },
    isSelected: (i: number) => index.value === i,
  }
}
