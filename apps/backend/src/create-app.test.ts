import { ApiErrorSchema, HealthResponseSchema, MeResponseSchema } from "@app/contracts";
import { describe, expect, it, vi } from "vitest";
import type { TokenVerifier } from "./auth/token-verifier.js";
import { createApp, MAX_BODY_BYTES } from "./create-app.js";
import { UpstreamUnavailableError } from "./http/errors.js";

const USER_ID = "3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const VALID_TOKEN = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl";
const FRONTEND_ORIGIN = "http://localhost:3000";

const acceptValidToken: TokenVerifier = (token) =>
  Promise.resolve(token === VALID_TOKEN ? { id: USER_ID, isAnonymous: false } : null);

function setup(verifyToken: TokenVerifier = acceptValidToken) {
  const verify = vi.fn(verifyToken);
  const app = createApp({ verifyToken: verify, allowedOrigins: [FRONTEND_ORIGIN] });
  return { app, verify };
}

async function errorCode(response: Response) {
  return ApiErrorSchema.parse(await response.json()).error.code;
}

describe("GET /health", () => {
  it("responds ok without authentication", async () => {
    const response = await setup().app.request("/health");

    expect(response.status).toBe(200);
    expect(HealthResponseSchema.parse(await response.json())).toEqual({ status: "ok" });
  });

  it("sets security headers and a request id", async () => {
    const response = await setup().app.request("/health");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });
});

describe("GET /v1/me", () => {
  it("rejects a request without a token and does not call the verifier", async () => {
    const { app, verify } = setup();

    const response = await app.request("/v1/me");

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe("Bearer");
    expect(await errorCode(response)).toBe("unauthorized");
    expect(verify).not.toHaveBeenCalled();
  });

  it.each(["Basic dXNlcjpwYXNz", "Bearer", "Bearer not-a-jwt", `Bearer ${VALID_TOKEN} extra`])(
    "rejects the malformed Authorization header %j without calling the verifier",
    async (authorization) => {
      const { app, verify } = setup();

      const response = await app.request("/v1/me", { headers: { Authorization: authorization } });

      expect(response.status).toBe(401);
      expect(verify).not.toHaveBeenCalled();
    },
  );

  it("rejects a token that the verifier does not accept", async () => {
    const { app, verify } = setup();
    const otherToken = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ4In0.b3RoZXI";

    const response = await app.request("/v1/me", {
      headers: { Authorization: `Bearer ${otherToken}` },
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe('Bearer error="invalid_token"');
    expect(verify).toHaveBeenCalledWith(otherToken);
  });

  it("returns the caller for a valid token and forbids caching", async () => {
    const { app, verify } = setup();

    const response = await app.request("/v1/me", {
      headers: { Authorization: `Bearer ${VALID_TOKEN}` },
    });

    expect(response.status).toBe(200);
    expect(MeResponseSchema.parse(await response.json())).toEqual({
      user: { id: USER_ID, isAnonymous: false },
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(verify).toHaveBeenCalledWith(VALID_TOKEN);
  });

  it("accepts the Bearer scheme in any letter case", async () => {
    const response = await setup().app.request("/v1/me", {
      headers: { Authorization: `bearer ${VALID_TOKEN}` },
    });

    expect(response.status).toBe(200);
  });

  it("returns 503 when the auth service cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { app } = setup(() => Promise.reject(new UpstreamUnavailableError("auth down")));

    const response = await app.request("/v1/me", {
      headers: { Authorization: `Bearer ${VALID_TOKEN}` },
    });

    expect(response.status).toBe(503);
    expect(await errorCode(response)).toBe("service_unavailable");
  });

  it("returns a generic 500 without leaking internal error details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { app } = setup(() => Promise.reject(new Error("connection string postgres://secret")));

    const response = await app.request("/v1/me", {
      headers: { Authorization: `Bearer ${VALID_TOKEN}` },
    });
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).not.toContain("secret");
    expect(ApiErrorSchema.parse(JSON.parse(body)).error.code).toBe("internal_error");
    expect(log).toHaveBeenCalledOnce();
  });
});

describe("CORS", () => {
  const preflight = (origin: string) =>
    setup().app.request("/v1/me", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization",
      },
    });

  it("allows the configured frontend origin", async () => {
    const response = await preflight(FRONTEND_ORIGIN);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_ORIGIN);
  });

  it("does not allow other origins", async () => {
    const response = await preflight("https://evil.example");

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("request limits and unknown routes", () => {
  it("rejects request bodies larger than the limit", async () => {
    const response = await setup().app.request("/v1/me", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": String(MAX_BODY_BYTES + 1) },
      body: "x".repeat(MAX_BODY_BYTES + 1),
    });

    expect(response.status).toBe(413);
    expect(await errorCode(response)).toBe("payload_too_large");
  });

  it("responds to unknown routes with a JSON 404", async () => {
    const response = await setup().app.request("/nope");

    expect(response.status).toBe(404);
    expect(await errorCode(response)).toBe("not_found");
  });
});
