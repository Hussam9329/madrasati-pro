/**
 * Prisma type re-exports.
 *
 * Previously this file hosted a hand-written shim that mimicked Prisma's
 * type namespace. Now that we use real Prisma + Neon, just re-export the
 * real `Prisma` namespace so existing imports (`import { Prisma } from
 * "@/lib/prisma-types"`) keep working.
 */

export { Prisma } from "@prisma/client";
