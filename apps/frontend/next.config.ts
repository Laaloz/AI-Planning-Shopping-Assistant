import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * The browser only ever talks to this origin. `/api/*` is proxied to the backend, so there is no
 * CORS and no backend URL in client code. BACKEND_URL is read at build time.
 */
function backendUrl(): string {
  const value =
    process.env.BACKEND_URL ?? (process.env.VERCEL ? undefined : "http://localhost:8787");
  if (!value) throw new Error("BACKEND_URL must be set for Vercel builds.");
  return new URL(value).origin;
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // A nonce-based Content-Security-Policy arrives with proxy.ts later in Phase 0.
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl()}/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
