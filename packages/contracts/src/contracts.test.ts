import { describe, expect, it } from "vitest";
import { ApiErrorSchema, HealthResponseSchema, MeResponseSchema } from "./index.js";

const USER_ID = "3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

describe("ApiErrorSchema", () => {
  it("accepts a known error code with an optional request id", () => {
    const body = {
      error: { code: "unauthorized", message: "Sign in to continue.", requestId: "r1" },
    };
    expect(ApiErrorSchema.parse(body)).toEqual(body);
  });

  it("rejects an unknown error code", () => {
    const body = { error: { code: "teapot", message: "No." } };
    expect(ApiErrorSchema.safeParse(body).success).toBe(false);
  });
});

describe("HealthResponseSchema", () => {
  it("accepts only status ok", () => {
    expect(HealthResponseSchema.safeParse({ status: "ok" }).success).toBe(true);
    expect(HealthResponseSchema.safeParse({ status: "degraded" }).success).toBe(false);
  });
});

describe("MeResponseSchema", () => {
  it("accepts a user with a UUID id", () => {
    const body = { user: { id: USER_ID, isAnonymous: true } };
    expect(MeResponseSchema.parse(body)).toEqual(body);
  });

  it("rejects a non-UUID id", () => {
    const body = { user: { id: "user-1", isAnonymous: false } };
    expect(MeResponseSchema.safeParse(body).success).toBe(false);
  });
});
