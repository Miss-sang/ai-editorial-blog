import type { AdminSessionState } from '~/types/content-studio'

const emptySession = (): AdminSessionState => ({
  authenticated: false,
  email: null,
  displayName: null
})

export function useAdminSession() {
  const session = useState<AdminSessionState>('admin-session', emptySession)
  const pending = useState<boolean>('admin-session-pending', () => false)

  const refreshSession = async () => {
    if (pending.value) {
      return session.value
    }

    pending.value = true

    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      session.value = await $fetch<AdminSessionState>('/api/admin/auth/session', {
        headers
      })
    } catch {
      session.value = emptySession()
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

    return session.value
  }

  const logout = async () => {
    await $fetch('/api/admin/auth/logout', {
      method: 'POST'
    })

    session.value = emptySession()
  }

  return {
    session,
    pending,
    refreshSession,
    login,
    logout
  }
}
