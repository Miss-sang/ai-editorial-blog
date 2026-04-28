import { setHeader, type H3Event } from 'h3'

export function setPublicContentCacheHeaders(event: H3Event, maxAge = 60) {
  setHeader(
    event,
    'Cache-Control',
    `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 5}`
  )
}
