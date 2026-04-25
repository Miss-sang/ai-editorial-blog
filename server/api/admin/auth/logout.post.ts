import { defineEventHandler } from 'h3'
import { clearAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler((event) => {
  clearAdminSession(event)

  return {
    ok: true
  }
})
