import { describe, expect, it } from 'vitest'
import { collectMatches } from '../../app/utils/find'

function rootWith(html: string) {
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}

describe('collectMatches', () => {
  it('finds case-insensitive literal substrings', () => {
    const root = rootWith('<p>Security+ in progress</p><p>AWS</p>')
    expect(collectMatches(root, 'security+')).toHaveLength(1)
    expect(collectMatches(root, 'aws')).toHaveLength(1)
  })

  it('returns nothing for an empty query', () => {
    expect(collectMatches(rootWith('<p>hello</p>'), '')).toHaveLength(0)
    expect(collectMatches(rootWith('<p>hello</p>'), '   ')).toHaveLength(0)
  })

  it('skips the find bar and visually hidden nodes', () => {
    const root = rootWith(
      '<div data-find-bar>Security+</div>'
      + '<p class="visually-hidden">Security+</p>'
      + '<p>visible</p>',
    )
    expect(collectMatches(root, 'Security+')).toHaveLength(0)
    expect(collectMatches(root, 'visible')).toHaveLength(1)
  })

  it('skips display:none subtrees so no-js copies are not searched', () => {
    const root = rootWith(
      '<p>translate this</p>'
      + '<div style="display:none">translate this too</div>',
    )
    expect(collectMatches(root, 'translate')).toHaveLength(1)
  })

  it('does not treat regex metacharacters as a pattern', () => {
    const root = rootWith('<p>cost is $40%</p>')
    expect(collectMatches(root, '$40%')).toHaveLength(1)
    expect(collectMatches(root, '40.')).toHaveLength(0)
  })
})
