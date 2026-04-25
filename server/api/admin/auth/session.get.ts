import { defineEventHandler } from 'h3'
import { getAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler((event) => {
  return getAdminSession(event)
})
