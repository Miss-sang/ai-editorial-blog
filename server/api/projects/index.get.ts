import { defineEventHandler } from 'h3'
import { listPublicProjects } from '~/server/lib/content-studio'
import { setPublicContentCacheHeaders } from '~/server/utils/public-cache'

export default defineEventHandler(async (event) => {
  setPublicContentCacheHeaders(event)
  return await listPublicProjects()
})
