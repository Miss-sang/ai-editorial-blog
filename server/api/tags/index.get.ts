import { defineEventHandler } from 'h3'
import { listPublicTags } from '~/server/lib/content-studio'

export default defineEventHandler(async () => {
  return await listPublicTags()
})
