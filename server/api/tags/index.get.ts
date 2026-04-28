import { defineEventHandler } from 'h3'
import { listPublicTags } from '~/server/lib/content-studio'
import { setPublicContentCacheHeaders } from '~/server/utils/public-cache'

export default defineEventHandler(async (event) => {
  setPublicContentCacheHeaders(event)
  return await listPublicTags()
})
