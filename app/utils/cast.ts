export interface CastHeader {
  version: number
  width: number
  height: number
}

export interface CastEvent {
  time: number
  kind: string
  data: string
}

export interface CastFile {
  header: CastHeader
  events: CastEvent[]
}

export function parseCast(source: string): CastFile {
  const lines = source.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) {
    throw new Error('empty asciicast')
  }

  const header = JSON.parse(lines[0]!) as CastHeader
  if (header.version !== 2) {
    throw new Error('unsupported asciicast version (need v2)')
  }

  const events = lines.slice(1).map((line) => {
    const parsed = JSON.parse(line) as [number, string, string]
    return { time: parsed[0]!, kind: parsed[1]!, data: parsed[2]! }
  })

  return { header, events }
}

export function outputUpTo(events: readonly CastEvent[], time: number): string {
  return events
    .filter(event => event.kind === 'o' && event.time <= time)
    .map(event => event.data)
    .join('')
}

export function duration(events: readonly CastEvent[]): number {
  return events.reduce((max, event) => Math.max(max, event.time), 0)
}

export function stripAnsi(value: string): string {
  const csi = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*[A-Za-z]`, 'g')
  return value.replace(csi, '')
}
