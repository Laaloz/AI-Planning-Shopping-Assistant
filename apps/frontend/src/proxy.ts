import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Locale negotiation only. Session refresh and the CSP are added to this file with Supabase Auth.
export default createMiddleware(routing);

export const config = {
  // Skip the API rewrite, Next.js internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
