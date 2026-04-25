import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

async function readEnvFile() {
  const envText = await readFile('.env', 'utf8')
  const env = {}

  for (const line of envText.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) {
      continue
    }

    const separator = line.indexOf('=')

    if (separator === -1) {
      continue
    }

    const key = line.slice(0, separator)
    const value = line.slice(separator + 1)
    env[key] = value
  }

  return env
}

function escapeSqlLiteral(value) {
  return value.replaceAll("'", "''")
}

const env = await readEnvFile()
const connectionString =
  process.env.DATABASE_URL_OVERRIDE ||
  process.env.DATABASE_URL ||
  env.DATABASE_URL_OVERRIDE ||
  env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env')
}

const parsedUrl = new URL(connectionString)
const currentUser = decodeURIComponent(parsedUrl.username)
const currentPassword = decodeURIComponent(parsedUrl.password)

if (!currentUser.startsWith('prisma.')) {
  throw new Error(
    `Expected DATABASE_URL username to start with "prisma.", received "${currentUser}".`
  )
}

const adminConnectionString =
  process.env.ADMIN_DATABASE_URL ||
  env.ADMIN_DATABASE_URL ||
  (() => {
    const adminUrl = new URL(connectionString)
    adminUrl.username = encodeURIComponent(currentUser.replace(/^prisma\./, 'postgres.'))
    return adminUrl.toString()
  })()

const client = new Client({
  connectionString: adminConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

const escapedPassword = escapeSqlLiteral(currentPassword)

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'prisma') THEN
    EXECUTE 'create user "prisma" with password ''${escapedPassword}'' bypassrls createdb';
  ELSE
    EXECUTE 'alter user "prisma" with password ''${escapedPassword}''';
    EXECUTE 'alter role "prisma" bypassrls createdb login';
  END IF;
END
$$;

grant "prisma" to "postgres";
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
`

try {
  await client.connect()
  await client.query(sql)
  console.log(
    JSON.stringify(
      {
        ok: true,
        role: 'prisma',
        poolerUser: currentUser
      },
      null,
      2
    )
  )
} catch (error) {
  if (error instanceof Error) {
    console.error(
      [
        'Failed to connect with admin database credentials.',
        'If you rotated the Supabase database password, update local .env DATABASE_URL first.',
        'You can also provide a dedicated admin connection string via ADMIN_DATABASE_URL.'
      ].join(' ')
    )
  }
  throw error
} finally {
  await client.end()
}
