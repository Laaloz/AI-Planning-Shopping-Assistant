import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

const base = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("loadEnv", () => {
  it("applies defaults for optional variables", () => {
    expect(loadEnv(base)).toEqual({
      ...base,
      ALLOWED_ORIGINS: ["http://localhost:3000"],
      PORT: 8787,
    });
  });

  it("normalises the allowed origins list", () => {
    const env = loadEnv({
      ...base,
      ALLOWED_ORIGINS: " https://app.example.com/ , http://localhost:3000,, ",
      PORT: "9000",
    });

    expect(env.ALLOWED_ORIGINS).toEqual(["https://app.example.com", "http://localhost:3000"]);
    expect(env.PORT).toBe(9000);
  });

  it("rejects an invalid origin", () => {
    expect(() => loadEnv({ ...base, ALLOWED_ORIGINS: "not an origin" })).toThrow(/ALLOWED_ORIGINS/);
  });

  it("names a missing variable", () => {
    expect(() => loadEnv({ SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" })).toThrow(
      /SUPABASE_URL/,
    );
  });

  it("names invalid variables without echoing any values", () => {
    const secretLooking = "sb_publishable_should_not_appear";

    const message = thrownMessage(() =>
      loadEnv({ SUPABASE_URL: "not a url", SUPABASE_PUBLISHABLE_KEY: secretLooking }),
    );

    expect(message).toContain("SUPABASE_URL");
    expect(message).not.toContain(secretLooking);
    expect(message).not.toContain("not a url");
  });
});

function thrownMessage(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error("Expected the function to throw");
}
