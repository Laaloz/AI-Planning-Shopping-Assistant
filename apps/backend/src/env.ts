import { z } from "zod";

/** Comma-separated origins, normalised to `scheme://host[:port]` so they match the Origin header. */
const OriginListSchema = z.string().transform((value, ctx) => {
  const origins: string[] = [];
  for (const entry of value.split(",").map((part) => part.trim())) {
    if (!entry) continue;
    try {
      origins.push(new URL(entry).origin);
    } catch {
      ctx.addIssue({ code: "custom", message: `"${entry}" is not a valid origin` });
      return z.NEVER;
    }
  }
  return origins;
});

const EnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  ALLOWED_ORIGINS: OriginListSchema.default(["http://localhost:3000"]),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8787),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validates the backend environment once at startup and fails fast. Error messages name the
 * variables but never echo their values.
 */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid backend environment. ${problems}`);
  }
  return result.data;
}
