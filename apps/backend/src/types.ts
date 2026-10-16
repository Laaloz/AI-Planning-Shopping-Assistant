import type { AuthUser } from "./auth/token-verifier.js";

/** Hono environment shared by every route and middleware. */
export interface AppEnv {
  Variables: {
    /** Set by `requireUser`; only available on authenticated routes. */
    user: AuthUser;
  };
}
