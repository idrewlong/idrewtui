import { onMounted, readonly, ref } from 'vue'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'idrewlong:theme'

/** Pure: the other theme. */
export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

/** Pure: a stored value is only trusted when it is a known theme. */
export function parseStoredTheme(value: string | null): Theme | null {
  return value === 'dark' || value === 'light' ? value : null
}

/**
 * Pure: stored choice wins; otherwise follow the OS; otherwise dark.
 * Mirrors the inline head script in app.vue that prevents a flash of the
 * wrong theme before hydration.
 */
export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  return parseStoredTheme(stored) ?? (prefersLight ? 'light' : 'dark')
}

/**
 * Theme state is read from the DOM on mount rather than rendered server-side,
 * because a static build has no per-visitor theme to prerender.
 */
export function useTheme() {
  const theme = ref<Theme>('dark')

  function apply(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    }
    catch {
      // Private mode or blocked storage: the choice just won't persist.
    }
  }

  function toggle() {
    apply(oppositeTheme(theme.value))
    return theme.value
  }

  onMounted(() => {
    const attr = document.documentElement.dataset.theme
    theme.value = parseStoredTheme(attr ?? null)
      ?? resolveTheme(null, window.matchMedia('(prefers-color-scheme: light)').matches)
  })

  return { theme: readonly(theme), toggle, apply }
}
