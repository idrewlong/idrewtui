import { describe, expect, it } from 'vitest'
import { composeMailto } from '../../app/utils/mailto'
import { profile } from '../../app/data/profile'

describe('composeMailto', () => {
  const to = profile.contact.find(c => c.channel === 'email')!.value

  it('uses the profile email and omits empty fields', () => {
    expect(composeMailto({ to, subject: '', body: '' })).toBe(`mailto:${to}`)
  })

  it('encodes subject and body instead of concatenating raw query text', () => {
    const href = composeMailto({
      to,
      subject: 'hello & hi',
      body: 'line one\nline two',
    })

    expect(href.startsWith(`mailto:${to}?`)).toBe(true)
    expect(href).toContain('subject=hello%20%26%20hi')
    expect(href).toContain('body=line%20one%0Aline%20two')
    expect(href).not.toContain('hello & hi')
  })

  it('does not invent a recipient', () => {
    const href = composeMailto({ to, subject: 'x', body: '' })
    expect(href).toContain(`mailto:${to}`)
    expect(href).not.toMatch(/mailto:[^?]+,/ )
  })
})
