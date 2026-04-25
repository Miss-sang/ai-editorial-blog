import { defineEventHandler } from 'h3'
import { listPublicTopics } from '~/server/lib/content-studio'

export default defineEventHandler(async () => {
  return await listPublicTopics()
})
