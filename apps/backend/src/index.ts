import { composeApp } from "./compose.js";
import { loadEnv } from "./env.js";

// Vercel entry point. Vercel detects this file and serves the default-exported Hono app as a
// function. Keep the file name: Vercel only looks for index, app or server entry files.
export default composeApp(loadEnv());
