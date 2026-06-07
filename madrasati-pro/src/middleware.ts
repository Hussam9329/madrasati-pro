import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET_TEXT = process.env.JWT_SECRET || "madrasati-secret-key-2024-marina-school";
const SESSION_COOKIE_NAME = "madrasati_session";
const publicRoutes = ["/login"];

// ─── JWT Verification Cache ─────────────────────────────────────
// Avoids re-computing crypto.subtle.verify for the same token
// within a short time window (useful for rapid navigation).
// Key: token string, Value: { valid: boolean, expiresAt: number }

const jwtCache = new Map<string, { valid: boolean; expiresAt: number }>();
const JWT_CACHE_TTL_MS = 30_000; // 30 seconds
const MAX_JWT_CACHE_ENTRIES = 50;

function getCachedJwt(token: string): boolean | null {
  const entry = jwtCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    jwtCache.delete(token);
    return null;
  }
  return entry.valid;
}

function setCachedJwt(token: string, valid: boolean): void {
  if (jwtCache.size >= MAX_JWT_CACHE_ENTRIES) {
    // Evict expired entries first
    const now = Date.now();
    for (const [k, v] of jwtCache) {
      if (now > v.expiresAt) jwtCache.delete(k);
    }
    // If still full, delete the oldest
    if (jwtCache.size >= MAX_JWT_CACHE_ENTRIES) {
      const firstKey = jwtCache.keys().next().value;
      if (firstKey) jwtCache.delete(firstKey);
    }
  }
  jwtCache.set(token, { valid, expiresAt: Date.now() + JWT_CACHE_TTL_MS });
}

function base64UrlToUint8Array(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * Quick expiry check without crypto verification.
 * Returns true if the token payload has expired (fast path).
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payloadText = new TextDecoder().decode(base64UrlToUint8Array(parts[1]));
    const payload = JSON.parse(payloadText) as { exp?: number };
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return true;
    return false;
  } catch {
    return true;
  }
}

async function verifyHs256Jwt(token: string): Promise<boolean> {
  // Fast path: check cache
  const cached = getCachedJwt(token);
  if (cached !== null) return cached;

  // Fast path: check expiry without crypto
  if (isTokenExpired(token)) {
    setCachedJwt(token, false);
    return false;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    setCachedJwt(token, false);
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET_TEXT),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToUint8Array(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );

    setCachedJwt(token, isValid);
    return isValid;
  } catch {
    setCachedJwt(token, false);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    if (await verifyHs256Jwt(token)) {
      return NextResponse.next();
    }
  } catch {
    // invalid token payload/signature
  }

  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
