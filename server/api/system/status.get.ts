import { readBootstrapStatus } from '~/server/utils/env'

export default defineEventHandler(() => {
  return {
    status: 'ok',
    services: readBootstrapStatus()
  }
})
