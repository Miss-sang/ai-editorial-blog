import { defineEventHandler } from 'h3'
import { listPublicArticles } from '~/server/lib/content-studio'

export default defineEventHandler(async () => {
  return await listPublicArticles()
})
