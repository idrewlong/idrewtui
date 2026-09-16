import { onMounted, readonly, ref } from 'vue'

/**
 * One-of-N theme selection. Themes are generated into `themes.css` from the
 * vendored Omarchy palettes; this module only decides which one is active.
 *
 * Keep THEME_NAMES in sync with THEME_ORDER in scripts/generate-themes.mjs.
 */
export const THEME_NAMES = [
  'tokyo-night', 'kanagawa', 'catppuccin', 'gruvbox', 'everforest',
  'osaka-jade', 'matte-black', 'ristretto', 'rose-pine', 'catppuccin-latte',
] as const

export type Theme = typeof THEME_NAMES[number]

export const DEFAULT_DARK: Theme = 'tokyo-night'
export const DEFAULT_LIGHT: Theme = 'catppuccin-latte'
export const THEME_STORAGE_KEY = 'idrewlong:theme'

/** A stored value is only trusted when it names a theme we actually ship. */
export function parseStoredTheme(value: string | null): Theme | null {
  return THEME_NAMES.includes(value as Theme) ? value as Theme : null
}

/** Stored choice wins; otherwise follow the OS. Mirrors the inline script in app.vue. */
export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  return parseStoredTheme(stored) ?? (prefersLight ? DEFAULT_LIGHT : DEFAULT_DARK)
}

/** Next theme in cycle order; an unrecognised theme restarts the cycle. */
export function nextTheme(current: string): Theme {
  const i = THEME_NAMES.indexOf(current as Theme)
  return THEME_NAMES[(i + 1) % THEME_NAMES.length]!
}

/**
 * Theme state is read from the DOM on mount rather than rendered server-side,
 * because a static build has no per-visitor theme to prerender.
 */
export function useTheme() {
  const theme = ref<Theme>(DEFAULT_DARK)

  function set(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    }
    catch {
      // Private mode or blocked storage: the choice just won't persist.
    }
  }

  function cycle(): Theme {
    set(nextTheme(theme.value))
    return theme.value
  }

  onMounted(() => {
    // The pre-paint script in app.vue has already stamped data-theme.
    theme.value = parseStoredTheme(document.documentElement.dataset.theme ?? null)
      ?? resolveTheme(null, window.matchMedia('(prefers-color-scheme: light)').matches)
  })

  return { theme: readonly(theme), set, cycle, names: THEME_NAMES }
}
