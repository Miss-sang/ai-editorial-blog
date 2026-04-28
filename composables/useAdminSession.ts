import type { AdminSessionState } from '~/types/content-studio'

const emptySession = (): AdminSessionState => ({
  authenticated: false,
  email: null,
  displayName: null
})

export function useAdminSession() {
  const session = useState<AdminSessionState>('admin-session', emptySession)
  const pending = useState<boolean>('admin-session-pending', () => false)
  const checked = useState<boolean>('admin-session-checked', () => false)

  const waitForPendingSession = async () => {
    while (pending.value) {
      await new Promise((resolve) => window.setTimeout(resolve, 20))
    }
  }

  const refreshSession = async (options: { force?: boolean } = {}) => {
    if (checked.value && !options.force) {
      return session.value
    }

    if (pending.value) {
      if (import.meta.client) {
        await waitForPendingSession()
      }

      return session.value
    }

    pending.value = true

    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      session.value = await $fetch<AdminSessionState>('/api/admin/auth/session', {
        headers
      })
      checked.value = true
    } catch {
      session.value = emptySession()
      checked.value = true
    } finally {
      pending.value = false
    }

    return session.value
  }

  const login = async (payload: { email: string; password: string }) => {
    session.value = await $fetch<AdminSessionState>('/api/admin/auth/login', {
      method: 'POST',
      body: payload
    })
    checked.value = true

    return session.value
  }

  const logout = async () => {
    await $fetch('/api/admin/auth/logout', {
      method: 'POST'
    })

    session.value = emptySession()
    checked.value = true
  }

  return {
    session,
    pending,
    checked,
    refreshSession,
    login,
    logout
  }
}
