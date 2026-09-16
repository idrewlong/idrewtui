export interface GeneratedTheme {
  name: string
  mode: 'dark' | 'light'
  tokens: {
    bg: string
    surface: string
    line: string
    fg: string
    muted: string
    accent: string
    link: string
    danger: string
  }
}

export declare const THEME_ORDER: string[]
export declare function generateThemes(): GeneratedTheme[]
