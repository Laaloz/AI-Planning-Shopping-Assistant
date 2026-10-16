import { z } from "zod";

/** Machine-readable error codes. Clients branch on `code`, never on `message`. */
export const ApiErrorCodeSchema = z.enum([
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "payload_too_large",
  "rate_limited",
  "internal_error",
  "service_unavailable",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/**
 * Body of every non-2xx JSON response. `message` is safe to show to users and never contains
 * stack traces, SQL, provider errors or other internals.
 */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    requestId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
