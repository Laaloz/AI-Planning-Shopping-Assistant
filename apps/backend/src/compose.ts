import { createSupabaseTokenVerifier } from "./auth/supabase-token-verifier.js";
import { createApp } from "./create-app.js";
import type { Env } from "./env.js";

/** Wires the real dependencies into the app. Tests call `createApp` with fakes instead. */
export function composeApp(env: Env) {
  return createApp({
    verifyToken: createSupabaseTokenVerifier({
      url: env.SUPABASE_URL,
      publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
    }),
    allowedOrigins: env.ALLOWED_ORIGINS,
  });
}
