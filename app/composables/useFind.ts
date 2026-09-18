import { nextTick, onBeforeUnmount, watch } from 'vue'
import { useState } from '#app'
import { useRoute } from 'vue-router'
import { wrapIndex } from '~/composables/useSelection'
import { useOverlay } from '~/composables/useOverlay'
import {
  clearHighlights,
  collectMatches,
  paintMatches,
  rangeElement,
} from '~/utils/find'

/** Ranges cannot live in useState (not serialisable); one list for the app. */
let matches: Range[] = []
let lifecycleBound = false

/**
 * `/` find in the content pane. Highlights use the CSS Highlight API so Vue
 * does not have to own wrapped `<mark>` nodes.
 */
export function useFind() {
  const overlay = useOverlay()
  const route = useRoute()

  const query = useState('find-query', () => '')
  const lastQuery = useState('find-last-query', () => '')
  const current = useState('find-current', () => -1)
  const count = useState('find-count', () => 0)
  const announcement = useState('find-announcement', () => '')

  function pane(): Element | null {
    return document.getElementById('main')
  }

  function announce(q: string, n: number) {
    if (!q.trim()) {
      announcement.value = ''
      return
    }
    announcement.value = n === 0 ? 'no matches' : `${n} ${n === 1 ? 'match' : 'matches'}`
  }

  function reveal() {
    paintMatches(matches, current.value)
    const range = matches[current.value]
    if (!range) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rangeElement(range)?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  function run(q: string) {
    query.value = q
    if (q.trim()) lastQuery.value = q
    const root = pane()
    matches = root ? collectMatches(root, q) : []
    count.value = matches.length
    current.value = matches.length > 0 ? 0 : -1
    announce(q, matches.length)
    reveal()
  }

  function open() {
    overlay.open('find')
  }

  function close() {
    clearHighlights()
    query.value = ''
    announcement.value = ''
    matches = []
    current.value = -1
    count.value = 0
    if (overlay.mode.value === 'find') overlay.close()
  }

  function step(delta: number) {
    if (overlay.mode.value !== 'find') {
      if (!lastQuery.value) return
      overlay.open('find')
      run(lastQuery.value)
      return
    }
    if (matches.length === 0) {
      if (lastQuery.value) run(lastQuery.value)
      if (matches.length === 0) return
    }
    current.value = wrapIndex(current.value, delta, matches.length)
    reveal()
  }

  function rescan() {
    if (overlay.mode.value === 'find' && query.value) run(query.value)
  }

  if (import.meta.client && !lifecycleBound) {
    lifecycleBound = true
    watch(() => route.fullPath, () => {
      lastQuery.value = ''
      close()
    })
    watch(() => overlay.mode.value, (mode, prev) => {
      if (prev === 'find' && mode !== 'find') {
        clearHighlights()
        query.value = ''
        announcement.value = ''
        matches = []
        current.value = -1
        count.value = 0
      }
    })
    onBeforeUnmount(() => {
      clearHighlights()
      lifecycleBound = false
    })
  }

  return {
    query,
    lastQuery,
    current,
    count,
    announcement,
    open,
    close,
    run,
    next: () => step(1),
    prev: () => step(-1),
    rescan,
    focusInput: async () => {
      await nextTick()
      document.getElementById('find-input')?.focus()
    },
  }
}
