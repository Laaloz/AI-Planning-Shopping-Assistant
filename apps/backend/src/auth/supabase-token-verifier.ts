import { createClient, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { z } from "zod";
import { UpstreamUnavailableError } from "../http/errors.js";
import type { AuthUser, TokenVerifier } from "./token-verifier.js";

/** Claims of a signed-in user's access token. Anonymous users also have the `authenticated` role. */
const UserClaimsSchema = z.object({
  sub: z.uuid(),
  role: z.literal("authenticated"),
  is_anonymous: z.boolean().optional(),
});

/**
 * Maps verified JWT claims to the caller. Returns `null` for tokens that do not belong to a user,
 * such as the publishable key's `anon` role.
 */
export function claimsToAuthUser(claims: unknown): AuthUser | null {
  const parsed = UserClaimsSchema.safeParse(claims);
  if (!parsed.success) return null;
  return { id: parsed.data.sub, isAnonymous: parsed.data.is_anonymous ?? false };
}

export interface SupabaseTokenVerifierConfig {
  url: string;
  publishableKey: string;
}

/**
 * Verifies Supabase access tokens with `auth.getClaims()`. With asymmetric signing keys the
 * signature is checked locally against the project's cached JWKS; otherwise Supabase Auth checks
 * it. Never use `getSession()` for this: it does not verify the token.
 */
export function createSupabaseTokenVerifier(config: SupabaseTokenVerifierConfig): TokenVerifier {
  const supabase = createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return async (accessToken) => {
    const { data, error } = await supabase.auth.getClaims(accessToken);
    if (error) {
      if (isAuthRetryableFetchError(error)) {
        throw new UpstreamUnavailableError("Supabase Auth could not be reached", { cause: error });
      }
      return null;
    }
    return data ? claimsToAuthUser(data.claims) : null;
  };
}
