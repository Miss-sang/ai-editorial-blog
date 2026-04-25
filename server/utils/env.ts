export interface BootstrapStatus {
  database: boolean
  supabasePublic: boolean
  supabaseServiceRole: boolean
  supabaseStorage: boolean
  longcat: boolean
  adminSession: boolean
  adminCredentials: boolean
}

export function readBootstrapStatus(): BootstrapStatus {
  const config = useRuntimeConfig()

  return {
    database: Boolean(config.databaseUrl),
    supabasePublic: Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey),
    supabaseServiceRole: Boolean(config.supabaseServiceRoleKey),
    supabaseStorage: Boolean(config.supabaseStorageBucket),
    longcat: Boolean(config.longcatApiKey),
    adminSession: Boolean(config.adminSessionSecret),
    adminCredentials: Boolean(config.adminLoginEmail && config.adminLoginPassword)
  }
}

export function assertServerSecret(value: string | undefined, key: string): string {
  if (!value) {
    throw createError({
      statusCode: 500,
      statusMessage: `缺少必需的服务端配置：${key}`
    })
  }

  return value
}
