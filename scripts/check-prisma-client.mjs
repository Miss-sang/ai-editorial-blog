import { readFile } from 'node:fs/promises'
import prismaClientPackage from '@prisma/client'

const { PrismaClient } = prismaClientPackage

async function readEnvFile() {
  const envText = await readFile('.env', 'utf8')

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
    process.env[key] = value
  }
}

await readEnvFile()

if (process.env.DATABASE_URL_OVERRIDE) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_OVERRIDE
}

const prisma = new PrismaClient()

try {
  const rows = await prisma.$queryRawUnsafe(
    'select current_database() as db, current_schema() as schema'
  )
  console.log(JSON.stringify(rows[0], null, 2))
} finally {
  await prisma.$disconnect()
}
