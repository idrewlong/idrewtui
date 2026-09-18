import { formatCurlIndex } from '~~/app/utils/resume'

export default defineEventHandler((event) => {
  const base = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return formatCurlIndex(base)
})
