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

const env = await readEnvFile()
const connectionString = process.env.DATABASE_URL_OVERRIDE || env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env')
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

try {
  await client.connect()
  const result = await client.query(
    'select current_database() as db, current_schema() as schema, version() as version'
  )

  console.log(JSON.stringify(result.rows[0], null, 2))
} finally {
  await client.end()
}
