import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaDbUrl: string | undefined
}

const currentDbUrl = process.env.DATABASE_URL || ''

// Force reconnect if DATABASE_URL changed
if (globalForPrisma.prisma && globalForPrisma.prismaDbUrl !== currentDbUrl) {
  globalForPrisma.prisma.$disconnect().catch(() => {})
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaDbUrl = currentDbUrl
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaDbUrl = currentDbUrl
}