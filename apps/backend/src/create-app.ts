import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { requireUser } from "./auth/require-user.js";
import type { TokenVerifier } from "./auth/token-verifier.js";
import { handleError, jsonError } from "./http/errors.js";
import { healthRoutes } from "./routes/health.js";
import { meRoutes } from "./routes/me.js";
import type { AppEnv } from "./types.js";

export interface AppDependencies {
  verifyToken: TokenVerifier;
  /**
   * Browser origins allowed to call the API directly. The frontend normally calls the API through
   * its same-origin `/api` rewrite, so CORS is a second line of defence, not the main path.
   */
  allowedOrigins: readonly string[];
}

/** Larger request bodies are rejected before parsing. Images go to storage, not through the API. */
export const MAX_BODY_BYTES = 1024 * 1024;

/**
 * Builds the HTTP API. Dependencies are injected so tests can replace them; production wiring lives
 * in `compose.ts`.
 */
export function createApp({ verifyToken, allowedOrigins }: AppDependencies) {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(secureHeaders());
  app.use(
    cors({
      origin: [...allowedOrigins],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowHeaders: ["Authorization", "Content-Type"],
      exposeHeaders: ["X-Request-Id"],
      maxAge: 600,
    }),
  );
  app.use(
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => jsonError(c, 413, "payload_too_large", "The request body is too large."),
    }),
  );

  app.route("/health", healthRoutes);

  // Versioned API. Everything under /v1 requires a signed-in (possibly anonymous) user.
  const v1 = new Hono<AppEnv>();
  v1.use(requireUser(verifyToken));
  v1.use(async (c, next) => {
    await next();
    // Responses carry user data: never let browsers or proxies cache them.
    c.header("Cache-Control", "no-store");
  });
  v1.route("/me", meRoutes);
  app.route("/v1", v1);

  app.notFound((c) => jsonError(c, 404, "not_found", "Not found."));
  app.onError(handleError);

  return app;
}
