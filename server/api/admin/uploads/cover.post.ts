import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, readMultipartFormData } from 'h3'
import { createServerSupabaseServiceClient } from '~/server/lib/supabase'
import { requireAdminSession } from '~/server/utils/admin-session'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { createSlug } from '~/server/utils/slug'
import type { UploadResult } from '~/types/content-studio'

export default defineEventHandler(async (event): Promise<UploadResult> => {
  requireAdminSession(event)
  assertRateLimit(event, {
    bucket: 'cover-upload',
    limit: 20,
    windowMs: 10 * 60 * 1000,
    message: ({ retryAfter }) => `上传过于频繁，请在 ${retryAfter} 秒后重试。`
  })

  const form = await readMultipartFormData(event)
  const file = form?.find((part) => part.name === 'file' && part.filename)

  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: '封面图片不能为空。'
    })
  }

  const mimeType = file.type || 'application/octet-stream'

  if (!mimeType.startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: '仅支持上传图片文件。'
    })
  }

  const config = useRuntimeConfig()
  const supabase = createServerSupabaseServiceClient()
  const filename = file.filename || `cover-${Date.now()}`
  const extension = filename.includes('.') ? filename.split('.').pop() || 'png' : 'png'
  const objectPath = `covers/${new Date().toISOString().slice(0, 10)}/${createSlug(filename.replace(/\.[^.]+$/, ''))}-${randomUUID()}.${extension}`
  const storageBucket = String(config.supabaseStorageBucket || '')

  if (supabase && storageBucket) {
    const { error } = await supabase.storage
      .from(storageBucket)
      .upload(objectPath, file.data, {
        contentType: mimeType,
        upsert: true
      })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `封面上传失败：${error.message}`
      })
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(objectPath)

    return {
      url: data.publicUrl,
      path: objectPath,
      provider: 'supabase'
    }
  }

  if (file.data.byteLength > 1024 * 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: '当前本地回退模式仅支持 1MB 以内的图片，请为更大文件配置 Supabase 存储。'
    })
  }

  const dataUrl = `data:${mimeType};base64,${Buffer.from(file.data).toString('base64')}`

  return {
    url: dataUrl,
    path: objectPath,
    provider: 'inline'
  }
})
