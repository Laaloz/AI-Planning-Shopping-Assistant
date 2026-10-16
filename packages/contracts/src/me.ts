import { z } from "zod";

/** `GET /v1/me`: the authenticated caller, derived from a verified access token. */
export const MeResponseSchema = z.object({
  user: z.object({
    id: z.uuid(),
    isAnonymous: z.boolean(),
  }),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
