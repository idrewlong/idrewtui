import { describe, expect, it } from 'vitest'
import {
  resolveAction,
  shortcuts,
  shouldIgnoreKeyEvent,
  type ShortcutAction,
} from '../../app/composables/useKeybindings'

function keyEvent(key: string, init: Partial<KeyboardEventInit> = {}, target?: HTMLElement) {
  const event = new KeyboardEvent('keydown', { key, ...init })
  if (target) Object.defineProperty(event, 'target', { value: target })
  return event
}

describe('shortcut table', () => {
  it('maps every key to exactly one action', () => {
    const seen = new Map<string, ShortcutAction>()
    for (const shortcut of shortcuts) {
      for (const key of shortcut.keys) {
        expect(seen.has(key), `duplicate binding for "${key}"`).toBe(false)
        seen.set(key, shortcut.action)
      }
    }
  })

  it('gives every shortcut a label and description for the help overlay', () => {
    for (const shortcut of shortcuts) {
      expect(shortcut.label.length).toBeGreaterThan(0)
      expect(shortcut.description.length).toBeGreaterThan(0)
      expect(shortcut.keys.length).toBeGreaterThan(0)
    }
  })

  it('covers the interaction model in docs/PROJECT.md §7', () => {
    const actions = new Set(shortcuts.map(s => s.action))
    for (const expected of [
      'tab:1', 'tab:2', 'tab:3', 'tab:4', 'tab:prev', 'tab:next',
      'list:down', 'list:up', 'list:open', 'scroll:top', 'scroll:bottom',
      'projects:filter', 'resume:open', 'email:copy', 'theme:toggle',
      'help:toggle', 'overlay:close',
    ]) {
      expect(actions.has(expected as ShortcutAction), `missing ${expected}`).toBe(true)
    }
  })
})

describe('shouldIgnoreKeyEvent', () => {
  it('ignores keys typed into form fields', () => {
    for (const tag of ['input', 'textarea', 'select']) {
      const el = document.createElement(tag)
      expect(shouldIgnoreKeyEvent(keyEvent('j', {}, el as HTMLElement))).toBe(true)
    }
  })

  it('ignores keys typed into contenteditable regions', () => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    // happy-dom does not always derive isContentEditable from the attribute.
    Object.defineProperty(el, 'isContentEditable', { value: true })
    expect(shouldIgnoreKeyEvent(keyEvent('j', {}, el))).toBe(true)
  })

  it('never overrides browser or screen-reader chords', () => {
    expect(shouldIgnoreKeyEvent(keyEvent('l', { ctrlKey: true }))).toBe(true)
    expect(shouldIgnoreKeyEvent(keyEvent('l', { metaKey: true }))).toBe(true)
    expect(shouldIgnoreKeyEvent(keyEvent('l', { altKey: true }))).toBe(true)
  })

  it('allows a bare key on a plain element', () => {
    expect(shouldIgnoreKeyEvent(keyEvent('l', {}, document.createElement('div')))).toBe(false)
  })
})

describe('resolveAction', () => {
  it('resolves the documented keys', () => {
    expect(resolveAction(keyEvent('1'))).toBe('tab:1')
    expect(resolveAction(keyEvent('h'))).toBe('tab:prev')
    expect(resolveAction(keyEvent('l'))).toBe('tab:next')
    expect(resolveAction(keyEvent('?'))).toBe('help:toggle')
    expect(resolveAction(keyEvent('Escape'))).toBe('overlay:close')
  })

  it('is case-sensitive, so g and G differ', () => {
    expect(resolveAction(keyEvent('g'))).toBe('scroll:top')
    expect(resolveAction(keyEvent('G'))).toBe('scroll:bottom')
  })

  it('returns null for unbound keys', () => {
    expect(resolveAction(keyEvent('z'))).toBeNull()
    expect(resolveAction(keyEvent('F5'))).toBeNull()
  })

  it('returns null when the event must be ignored', () => {
    expect(resolveAction(keyEvent('1', { metaKey: true }))).toBeNull()
  })
})
