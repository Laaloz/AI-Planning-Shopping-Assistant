import { serve } from "@hono/node-server";
import { composeApp } from "./compose.js";
import { loadEnv } from "./env.js";

// Local development server. Not used on Vercel, which serves src/index.ts instead.
try {
  process.loadEnvFile(".env");
} catch (error) {
  // A missing .env file is fine: the variables may come from the shell.
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const env = loadEnv();

serve({ fetch: composeApp(env).fetch, port: env.PORT }, (info) => {
  console.log(`Backend listening on http://localhost:${info.port}`);
});
