import { describe, expect, it } from "vitest";
import { claimsToAuthUser } from "./supabase-token-verifier.js";

const USER_ID = "3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

describe("claimsToAuthUser", () => {
  it("maps a signed-in user's claims", () => {
    expect(claimsToAuthUser({ sub: USER_ID, role: "authenticated", is_anonymous: false })).toEqual({
      id: USER_ID,
      isAnonymous: false,
    });
  });

  it("marks anonymous users", () => {
    expect(claimsToAuthUser({ sub: USER_ID, role: "authenticated", is_anonymous: true })).toEqual({
      id: USER_ID,
      isAnonymous: true,
    });
  });

  it("treats a missing is_anonymous claim as a regular user", () => {
    expect(claimsToAuthUser({ sub: USER_ID, role: "authenticated" })?.isAnonymous).toBe(false);
  });

  it.each([
    ["the publishable key's anon role", { role: "anon" }],
    ["the service role", { sub: USER_ID, role: "service_role" }],
    ["a missing subject", { role: "authenticated" }],
    ["a non-UUID subject", { sub: "user-1", role: "authenticated" }],
    ["no claims at all", null],
  ])("rejects %s", (_label, claims) => {
    expect(claimsToAuthUser(claims)).toBeNull();
  });
});
