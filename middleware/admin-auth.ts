import { useAdminSession } from '~/composables/useAdminSession'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') {
    return
  }

  const { checked, session, refreshSession } = useAdminSession()

  if (!checked.value) {
    await refreshSession()
  }

  if (!session.value.authenticated) {
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
