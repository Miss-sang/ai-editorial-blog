import { defineEventHandler, readBody } from 'h3'
import { createProject } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'
import type { ProjectEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const body = await readBody<ProjectEditorPayload>(event)
  const project = await createProject(body)
  return {
    id: project.id
  }
})
