import { useState } from '#app'

/**
 * Transient status-bar message, the way a terminal echoes an action
 * ("yanked idrewlong@gmail.com"). Rendered in an aria-live region so the
 * confirmation reaches screen readers too.
 */
export function useStatusLine() {
  const message = useState<string>('status-line-message', () => '')
  let timer: ReturnType<typeof setTimeout> | undefined

  function flash(text: string, ms = 2400) {
    message.value = text
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { message.value = '' }, ms)
  }

  function clear() {
    if (timer) clearTimeout(timer)
    message.value = ''
  }

  return { message, flash, clear }
}
