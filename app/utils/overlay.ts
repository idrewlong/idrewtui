export type OverlayMode = 'normal' | 'palette' | 'find' | 'pager' | 'help' | 'compose'
export type PagerKind = 'man' | 'less'

export function overlayModeLabel(mode: OverlayMode): string {
  switch (mode) {
    case 'palette': return 'COMMAND'
    case 'find': return 'SEARCH'
    case 'pager': return 'PAGER'
    case 'compose': return 'MAIL'
    default: return 'NORMAL'
  }
}
