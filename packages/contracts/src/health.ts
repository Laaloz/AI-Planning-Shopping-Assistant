import { z } from "zod";

/** `GET /health`: liveness only. It reveals nothing about configuration or dependencies. */
export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
