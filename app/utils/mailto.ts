export function composeMailto(opts: {
  to: string
  subject: string
  body: string
}): string {
  const params: string[] = []
  if (opts.subject.trim()) {
    params.push(`subject=${encodeURIComponent(opts.subject.trim())}`)
  }
  if (opts.body.trim()) {
    params.push(`body=${encodeURIComponent(opts.body.trim())}`)
  }
  return params.length > 0
    ? `mailto:${opts.to}?${params.join('&')}`
    : `mailto:${opts.to}`
}
