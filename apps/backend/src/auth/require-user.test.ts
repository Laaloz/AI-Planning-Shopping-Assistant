import { describe, expect, it } from "vitest";
import { parseBearerToken } from "./require-user.js";

const JWT = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl";

describe("parseBearerToken", () => {
  it("extracts a JWT from a Bearer header", () => {
    expect(parseBearerToken(`Bearer ${JWT}`)).toBe(JWT);
  });

  it("treats the scheme as case-insensitive", () => {
    expect(parseBearerToken(`BEARER ${JWT}`)).toBe(JWT);
  });

  it.each([
    undefined,
    "",
    "Bearer",
    "Bearer ",
    `Basic ${JWT}`,
    "Bearer only.two",
    `Bearer ${JWT}.extra`,
    `Bearer ${JWT} trailing`,
    `Bearer ${JWT}\n`,
  ])("returns null for %j", (header) => {
    expect(parseBearerToken(header)).toBeNull();
  });

  it("returns null for oversized headers without parsing them", () => {
    expect(parseBearerToken(`Bearer ${"a".repeat(9000)}.b.c`)).toBeNull();
  });
});
