import type { HealthResponse } from "@app/contracts";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";

/** Liveness check for uptime monitors and the frontend's status indicator. Public. */
export const healthRoutes = new Hono<AppEnv>().get("/", (c) =>
  c.json({ status: "ok" } satisfies HealthResponse),
);
