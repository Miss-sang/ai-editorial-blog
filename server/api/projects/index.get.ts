import { defineEventHandler } from 'h3'
import { listPublicProjects } from '~/server/lib/content-studio'

export default defineEventHandler(async () => {
  return await listPublicProjects()
})
