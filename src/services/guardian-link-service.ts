import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getStudentClassDisplay } from "@/types/student";

/**
 * Secret guardian links (/p/<token>).
 *
 * Each student gets a random, unguessable token (never the sequential
 * studentCode). Anyone holding the link can read that student's report, so
 * the token is the only credential: 24 random bytes = 192 bits, encoded as
 * 32 base64url characters. Regenerating replaces it, so the old link stops
 * working immediately.
 *
 * These functions do not check the admin session; admin callers must call
 * requireAdmin / withApiAuth themselves.
 */

const GUARDIAN_TOKEN_BYTES = 24;
const GUARDIAN_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

/** Only active students have a working guardian link. */
const ACTIVE_STUDENT_STATUS = "active";

function generateGuardianToken() {
  return randomBytes(GUARDIAN_TOKEN_BYTES).toString("base64url");
}

export function isGuardianTokenFormatValid(token: string) {
  return GUARDIAN_TOKEN_PATTERN.test(token);
}

/**
 * Returns the student's guardian token, creating it on first use.
 * Race-safe: the token is written only while the column is still null, then
 * re-read, so two concurrent calls always end up returning the same token.
 * Returns null when the student does not exist.
 */
export async function getOrCreateGuardianToken(studentId: string): Promise<string | null> {
  const existing = await db.student.findUnique({
    where: { id: studentId },
    select: { guardianToken: true },
  });

  if (!existing) return null;
  if (existing.guardianToken) return existing.guardianToken;

  await db.student.updateMany({
    where: { id: studentId, guardianToken: null },
    data: { guardianToken: generateGuardianToken() },
  });

  const created = await db.student.findUnique({
    where: { id: studentId },
    select: { guardianToken: true },
  });

  return created?.guardianToken ?? null;
}

/**
 * Replaces the student's guardian token; the previous link stops working.
 * Returns null when the student does not exist.
 */
export async function regenerateGuardianToken(studentId: string): Promise<string | null> {
  const token = generateGuardianToken();
  const result = await db.student.updateMany({
    where: { id: studentId },
    data: { guardianToken: token },
  });

  return result.count > 0 ? token : null;
}

/**
 * Resolves a public guardian token to the minimal student fields the public
 * page shows. Malformed tokens are rejected before touching the database, and
 * non-active students (inactive / graduated / transferred) are treated as an
 * invalid link.
 */
export async function findStudentByGuardianToken(token: string) {
  if (!isGuardianTokenFormatValid(token)) return null;

  const student = await db.student.findUnique({
    where: { guardianToken: token },
    select: {
      id: true,
      fullName: true,
      status: true,
      enrollmentDate: true,
      section: {
        select: {
          name: true,
          class: { select: { name: true, level: true } },
        },
      },
    },
  });

  if (!student || student.status !== ACTIVE_STUDENT_STATUS) return null;

  return {
    id: student.id,
    fullName: student.fullName,
    enrollmentDate: student.enrollmentDate,
    classDisplay: getStudentClassDisplay({
      className: student.section?.class.name ?? null,
      classLevel: student.section?.class.level ?? null,
      sectionName: student.section?.name ?? null,
    }),
  };
}

export type GuardianLinkStudent = {
  id: string;
  fullName: string;
  classDisplay: string;
  /** guardianPhone, falling back to the student's own phone (same as the profile). */
  contactPhone: string | null;
  guardianToken: string;
};

/**
 * Active students with their guardian tokens, for the staff sending page.
 * Missing tokens are created first in one batch so every listed student has
 * a link.
 */
export async function listGuardianLinkStudents(): Promise<GuardianLinkStudent[]> {
  await ensureActiveStudentsHaveGuardianTokens();

  const students = await db.student.findMany({
    where: { status: ACTIVE_STUDENT_STATUS },
    select: {
      id: true,
      fullName: true,
      phone: true,
      guardianPhone: true,
      guardianToken: true,
      section: {
        select: {
          name: true,
          class: { select: { name: true, level: true } },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return students.flatMap((student) => {
    if (!student.guardianToken) return [];

    return [
      {
        id: student.id,
        fullName: student.fullName,
        classDisplay: getStudentClassDisplay({
          className: student.section?.class.name ?? null,
          classLevel: student.section?.class.level ?? null,
          sectionName: student.section?.name ?? null,
        }),
        contactPhone: student.guardianPhone?.trim() || student.phone?.trim() || null,
        guardianToken: student.guardianToken,
      },
    ];
  });
}

async function ensureActiveStudentsHaveGuardianTokens() {
  const missing = await db.student.findMany({
    where: { status: ACTIVE_STUDENT_STATUS, guardianToken: null },
    select: { id: true },
  });

  if (missing.length === 0) return;

  // Same "only while still null" guard as getOrCreateGuardianToken, so a
  // token created concurrently elsewhere is never overwritten.
  await db.$transaction(
    missing.map((student) =>
      db.student.updateMany({
        where: { id: student.id, guardianToken: null },
        data: { guardianToken: generateGuardianToken() },
      }),
    ),
  );
}
