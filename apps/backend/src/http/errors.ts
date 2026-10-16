import type { ApiError, ApiErrorCode } from "@app/contracts";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Thrown when a required service (for example Supabase Auth) cannot be reached. Maps to 503. */
export class UpstreamUnavailableError extends Error {
  override readonly name = "UpstreamUnavailableError";
}

/** Sends the shared error envelope. `message` must be safe to show to users. */
export function jsonError(
  c: Context,
  status: ContentfulStatusCode,
  code: ApiErrorCode,
  message: string,
): Response {
  const body: ApiError = { error: { code, message, requestId: c.get("requestId") } };
  return c.json(body, status);
}

const CODE_BY_STATUS: Partial<Record<number, ApiErrorCode>> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  413: "payload_too_large",
  429: "rate_limited",
};

/** Last-resort error handler: logs server-side and never returns internals to the client. */
export function handleError(error: Error, c: Context): Response {
  if (error instanceof HTTPException && error.status < 500) {
    return jsonError(c, error.status, CODE_BY_STATUS[error.status] ?? "bad_request", error.message);
  }

  // Server logs only. Never log tokens, request bodies or personal data here.
  console.error(
    JSON.stringify({
      level: "error",
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      error: { name: error.name, message: error.message, stack: error.stack },
    }),
  );

  if (error instanceof UpstreamUnavailableError) {
    return jsonError(
      c,
      503,
      "service_unavailable",
      "A required service is temporarily unavailable. Try again shortly.",
    );
  }
  return jsonError(c, 500, "internal_error", "Something went wrong. Try again later.");
}
