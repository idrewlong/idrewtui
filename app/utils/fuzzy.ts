/**
 * Tiny subsequence fuzzy matcher. Empty query matches everything equally so
 * the command palette can show the full catalog before anyone types.
 */

export function fuzzyScore(query: string, text: string): number | null {
  const q = query.trim().toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0

  const substringAt = t.indexOf(q)
  if (substringAt !== -1) {
    return 1000 - substringAt
  }

  let ti = 0
  let score = 0
  let run = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return null
    run = found === ti ? run + 1 : 1
    score += 1 + run * 5
    ti = found + 1
  }
  return score
}

export function rank<T extends { haystack: string }>(items: T[], query: string): T[] {
  const scored = items
    .map(item => ({ item, score: fuzzyScore(query, item.haystack) }))
    .filter((row): row is { item: T, score: number } => row.score !== null)

  if (!query.trim()) return scored.map(row => row.item)

  return scored
    .sort((a, b) => b.score - a.score)
    .map(row => row.item)
}
