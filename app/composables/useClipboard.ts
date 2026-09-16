import { ref } from 'vue'

/**
 * Copy helper with a legacy fallback, since `navigator.clipboard` needs a
 * secure context and can be blocked by permissions.
 */
export function useClipboard() {
  const copied = ref(false)

  async function copy(text: string): Promise<boolean> {
    let ok: boolean

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        ok = true
      }
      else {
        ok = legacyCopy(text)
      }
    }
    catch {
      ok = legacyCopy(text)
    }

    copied.value = ok
    return ok
  }

  return { copy, copied }
}

function legacyCopy(text: string): boolean {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()

  let ok: boolean
  try {
    ok = document.execCommand('copy')
  }
  catch {
    ok = false
  }

  document.body.removeChild(el)
  return ok
}
