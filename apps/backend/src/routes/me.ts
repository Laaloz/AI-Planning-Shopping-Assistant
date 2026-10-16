import type { MeResponse } from "@app/contracts";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";

/** The authenticated caller. Must be mounted behind `requireUser`. */
export const meRoutes = new Hono<AppEnv>().get("/", (c) => {
  const user = c.get("user");
  return c.json({ user: { id: user.id, isAnonymous: user.isAnonymous } } satisfies MeResponse);
});
