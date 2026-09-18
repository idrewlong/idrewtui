/**
 * Collect literal, case-insensitive substring matches inside a root without
 * mutating the DOM. Highlights are painted separately via the CSS Highlight API
 * so Vue's vnode tree is left alone.
 */

export function collectMatches(root: Element, query: string): Range[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  const ranges: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT
      return shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    },
  })

  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = node.nodeValue ?? ''
    const lower = text.toLowerCase()
    let from = 0
    while (from <= lower.length - needle.length) {
      const idx = lower.indexOf(needle, from)
      if (idx === -1) break
      const range = document.createRange()
      range.setStart(node, idx)
      range.setEnd(node, idx + needle.length)
      ranges.push(range)
      from = idx + needle.length
    }
  }

  return ranges
}

function shouldSkip(node: Node): boolean {
  let el = node.parentElement
  while (el) {
    if (el.hasAttribute('data-find-bar')) return true
    if (el.classList.contains('visually-hidden')) return true
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return true
    const tag = el.tagName
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return true
    const display = el.style.display
    if (display === 'none') return true
    if (typeof getComputedStyle === 'function') {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return true
    }
    el = el.parentElement
  }
  return false
}

const MATCH = 'find-match'
const CURRENT = 'find-current'

export function paintMatches(matches: Range[], current: number): void {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return

  CSS.highlights.delete(MATCH)
  CSS.highlights.delete(CURRENT)
  if (matches.length === 0) return

  const others = matches.filter((_, i) => i !== current)
  if (others.length > 0) {
    CSS.highlights.set(MATCH, new Highlight(...others))
  }
  const active = matches[current]
  if (active) {
    CSS.highlights.set(CURRENT, new Highlight(active))
  }
}

export function clearHighlights(): void {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return
  CSS.highlights.delete(MATCH)
  CSS.highlights.delete(CURRENT)
}

export function rangeElement(range: Range): Element | null {
  const node = range.startContainer
  return node instanceof Element ? node : node.parentElement
}
