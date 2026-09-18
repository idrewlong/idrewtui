/**
 * WMO weather interpretation codes, as returned by Open-Meteo.
 * https://open-meteo.com/en/docs — "Weather variable documentation".
 */
const CODES: Record<number, string> = {
  0: 'clear',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'rime fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  56: 'freezing drizzle',
  57: 'freezing drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'light showers',
  81: 'showers',
  82: 'violent showers',
  85: 'snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm with hail',
  99: 'thunderstorm with hail',
}

export function describeWeatherCode(code: number): string {
  return CODES[code] ?? 'unknown'
}

/**
 * Tiny decorative glyph for the forecast card. Hidden from assistive tech;
 * `describeWeatherCode` is the accessible text.
 */
export function asciiWeather(code: number): string {
  if (code === 0 || code === 1) {
    return [
      '  \\   /  ',
      '   .-.   ',
      '― (   ) ―',
      '   `-`   ',
    ].join('\n')
  }
  if (code >= 95) {
    return [
      '   .--.  ',
      '  (    ) ',
      '  /_  _\\ ',
      '   /\\    ',
    ].join('\n')
  }
  if (code >= 71 && code <= 86) {
    return [
      '   .--.  ',
      '  (    ) ',
      '  * * *  ',
      ' *  *  * ',
    ].join('\n')
  }
  if (code >= 51) {
    return [
      '   .--.  ',
      '  (    ) ',
      "  ' ' '  ",
      " ' ' ' ' ",
    ].join('\n')
  }
  return [
    '   .--.  ',
    '  (    ) ',
    ' (__-__) ',
    '         ',
  ].join('\n')
}
