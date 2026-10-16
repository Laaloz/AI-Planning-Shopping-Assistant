import { createMiddleware } from "hono/factory";
import { jsonError } from "../http/errors.js";
import type { AppEnv } from "../types.js";
import type { TokenVerifier } from "./token-verifier.js";

/** Longer headers are rejected without parsing. Supabase access tokens are far shorter. */
const MAX_AUTHORIZATION_LENGTH = 8192;

/** `Bearer <JWT>`: three base64url segments. The scheme is case-insensitive (RFC 9110). */
const BEARER_JWT = /^Bearer +([\w-]+\.[\w-]+\.[\w-]+)$/i;

/** Returns the JWT from an `Authorization: Bearer` header, or `null` if it is missing or malformed. */
export function parseBearerToken(header: string | undefined): string | null {
  if (!header || header.length > MAX_AUTHORIZATION_LENGTH) return null;
  return BEARER_JWT.exec(header)?.[1] ?? null;
}

/**
 * Rejects the request with 401 unless it carries a valid access token, and exposes the caller as
 * `c.get("user")`. Authorization (ownership of a resource) is still checked by each route and by
 * row-level security in the database.
 */
export function requireUser(verifyToken: TokenVerifier) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const token = parseBearerToken(c.req.header("Authorization"));
    const user = token ? await verifyToken(token) : null;
    if (!user) {
      c.header("WWW-Authenticate", token ? 'Bearer error="invalid_token"' : "Bearer");
      return jsonError(c, 401, "unauthorized", "Sign in to continue.");
    }
    c.set("user", user);
    await next();
  });
}
