/** The authenticated caller, derived only from a verified access token. */
export interface AuthUser {
  /** Supabase Auth user id (the `sub` claim). */
  id: string;
  /** True for users who started without an account (Supabase anonymous sign-in). */
  isAnonymous: boolean;
}

/**
 * Verifies an access token. Resolves to the caller, or to `null` when the token is malformed,
 * expired, revoked or does not belong to a signed-in user. Rejects only when verification itself
 * cannot run, for example when the auth server is unreachable.
 */
export type TokenVerifier = (accessToken: string) => Promise<AuthUser | null>;
