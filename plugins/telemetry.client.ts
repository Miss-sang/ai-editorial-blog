function getCookieValue(name: string) {
  const encodedName = `${encodeURIComponent(name)}=`
  const entries = document.cookie.split('; ')

  for (const entry of entries) {
    if (!entry.startsWith(encodedName)) {
      continue
    }

    return decodeURIComponent(entry.slice(encodedName.length))
  }

  return ''
}

function ensureTelemetrySessionCookie() {
  const existing = getCookieValue('telemetry_session')

  if (existing) {
    return existing
  }

  const sessionId = crypto.randomUUID()
  document.cookie = `telemetry_session=${encodeURIComponent(sessionId)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  return sessionId
}

function normalizeTrackedPath(value: string) {
  return value.split(/[?#]/u)[0] || '/'
}

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) {
    return
  }

  ensureTelemetrySessionCookie()
  const router = useRouter()

  const trackVisit = (path: string, referrer = '') => {
    const normalizedPath = normalizeTrackedPath(path)
    const normalizedReferrer = normalizeTrackedPath(referrer)

    if (!normalizedPath || normalizedPath.startsWith('/admin')) {
      return
    }

    void fetch('/api/telemetry/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: normalizedPath,
        referrer: normalizedReferrer
      }),
      credentials: 'same-origin',
      keepalive: true
    })
  }

  nuxtApp.hook('app:mounted', () => {
    trackVisit(window.location.pathname, document.referrer)
  })

  router.afterEach((to, from) => {
    const nextPath = normalizeTrackedPath(to.fullPath)
    const previousPath = normalizeTrackedPath(from.fullPath)

    if (nextPath === previousPath) {
      return
    }

    trackVisit(nextPath, previousPath)
  })
})
