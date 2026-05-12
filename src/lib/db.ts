import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaDbUrl: string | undefined
}

// Validate DATABASE_URL format before creating client
function isValidDatabaseUrl(url: string): boolean {
  if (!url) return false
  return url.startsWith('postgresql://') || url.startsWith('postgres://') || url.startsWith('file:')
}

// Lazy-initialize PrismaClient to ensure env vars are loaded
let _prismaClient: PrismaClient | null = null
let _lastDbUrl: string | undefined

function createPrismaClient(): PrismaClient | null {
  const currentDbUrl = process.env.DATABASE_URL || ''

  // Return cached client if URL hasn't changed
  if (_prismaClient && _lastDbUrl === currentDbUrl) {
    return _prismaClient
  }

  // Disconnect old client if URL changed
  if (_prismaClient && _lastDbUrl !== currentDbUrl) {
    _prismaClient.$disconnect().catch(() => {})
    _prismaClient = null
  }

  // Validate URL format
  if (!isValidDatabaseUrl(currentDbUrl)) {
    console.warn(
      '⚠️ DATABASE_URL is not set or invalid (must start with postgresql:// or postgres://).',
      'Current value starts with:', currentDbUrl ? `"${currentDbUrl.substring(0, 20)}..."` : '(empty)'
    )
    _lastDbUrl = currentDbUrl
    return null
  }

  // Use global cached client in development to avoid hot-reload issues
  if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma && globalForPrisma.prismaDbUrl === currentDbUrl) {
    _prismaClient = globalForPrisma.prisma
    _lastDbUrl = currentDbUrl
    return _prismaClient
  }

  // Create new client
  _prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

  _lastDbUrl = currentDbUrl

  // Cache in development
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = _prismaClient
    globalForPrisma.prismaDbUrl = currentDbUrl
  }

  return _prismaClient
}

/** Get the PrismaClient instance (lazy-initialized) */
export function getDb(): PrismaClient {
  const client = createPrismaClient()
  if (!client) {
    throw new Error('DATABASE_URL is not configured. Please set it in your environment variables.')
  }
  return client
}

/** Backward-compatible db export (throws if not configured) */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = createPrismaClient()
    if (!client) {
      throw new Error('DATABASE_URL is not configured. Please set it in your environment variables.')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

/** Check if database is available without throwing */
export function isDbAvailable(): boolean {
  return createPrismaClient() !== null
}

/** Return a standardized error response when database is unavailable */
export function dbUnavailableResponse() {
  return {
    error: 'قاعدة البيانات غير متاحة. يرجى التحقق من إعدادات الاتصال.',
    dbAvailable: false,
  }
}
