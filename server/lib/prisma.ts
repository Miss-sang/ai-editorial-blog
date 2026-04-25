type PrismaClientLike = {
  $disconnect: () => Promise<void>
}

const globalForPrisma = globalThis as {
  prisma?: PrismaClientLike
  prismaPromise?: Promise<PrismaClientLike>
}

export async function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = import('@prisma/client')
      .then((runtime) => {
        const prismaModule = runtime as {
          PrismaClient?: new (options?: { log?: string[] }) => PrismaClientLike
          default?: {
            PrismaClient?: new (options?: { log?: string[] }) => PrismaClientLike
          }
        }

        const PrismaClientCtor =
          prismaModule.PrismaClient ?? prismaModule.default?.PrismaClient

        if (!PrismaClientCtor) {
          throw new Error(
            'Prisma client is not generated yet. Run `npm run prisma:generate` after configuring DATABASE_URL.'
          )
        }

        const client = new PrismaClientCtor({
          log: import.meta.dev ? ['warn', 'error'] : ['error']
        }) as PrismaClientLike

        globalForPrisma.prisma = client
        return client
      })
      .catch((error) => {
        globalForPrisma.prismaPromise = undefined
        throw error
      })
  }

  return await globalForPrisma.prismaPromise
}
