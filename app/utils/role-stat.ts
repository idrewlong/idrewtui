import { profile } from '~/data/profile'
import { skillGroups } from '~/data/skills'
import type { ExperienceEntry } from '~/types/content'

/**
 * Multi-word tokens that appear in experience bullets. Kept explicit so
 * "React Native" is not counted as a second "React".
 */
const COMPOUNDS = ['React Native']

function tokens(): string[] {
  const raw = [
    ...COMPOUNDS,
    ...profile.stack,
    ...skillGroups.flatMap(group => group.items),
  ]
  const expanded: string[] = []
  for (const token of raw) {
    expanded.push(token)
    if (token.includes('/')) {
      expanded.push(...token.split('/').map(part => part.trim()).filter(Boolean))
    }
  }
  return [...new Set(expanded)].sort((a, b) => b.length - a.length)
}

function isBoundary(text: string, index: number): boolean {
  return index < 0 || index >= text.length || !/\w/.test(text[index]!)
}

export function extractTokens(text: string, dictionary = tokens()): string[] {
  const lower = text.toLowerCase()
  const found: { start: number, end: number, token: string }[] = []

  for (const token of dictionary) {
    const needle = token.toLowerCase()
    let from = 0
    while (from < lower.length) {
      const start = lower.indexOf(needle, from)
      if (start === -1) break
      const end = start + needle.length
      const bounded = isBoundary(text, start - 1) && isBoundary(text, end)
      const overlap = found.some(hit => start < hit.end && end > hit.start)
      if (bounded && !overlap) {
        found.push({ start, end, token })
      }
      from = start + 1
    }
  }

  return found.sort((a, b) => a.start - b.start).map(hit => hit.token)
}

export function roleStat(role: ExperienceEntry): { stack: string[], outcome: string | null } {
  const outcome = role.bullets.find(bullet => bullet.trim().length > 0 && !/TODO/i.test(bullet)) ?? null
  return {
    stack: extractTokens(role.bullets.join(' ')),
    outcome,
  }
}
