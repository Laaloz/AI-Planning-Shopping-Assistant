import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { allocateMinorUnits, formatMoney, MoneySchema } from "./money.js";

// Up to one million euros in cents, split across at most 20 items.
const totals = fc.integer({ min: 0, max: 100_000_000 });
const weightLists = fc
  .array(fc.integer({ min: 0, max: 1_000_000 }), { minLength: 1, maxLength: 20 })
  .filter((weights) => weights.some((weight) => weight > 0));

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

describe("allocateMinorUnits", () => {
  it("returns parts that add up to the total", () => {
    fc.assert(
      fc.property(totals, weightLists, (total, weights) => {
        expect(sum(allocateMinorUnits(total, weights))).toBe(total);
      }),
    );
  });

  it("keeps every part within one minor unit of its exact share", () => {
    fc.assert(
      fc.property(totals, weightLists, (total, weights) => {
        const weightSum = BigInt(sum(weights));
        allocateMinorUnits(total, weights).forEach((part, index) => {
          // |part - total * weight / weightSum| < 1, compared exactly with integers.
          const scaledDifference =
            BigInt(part) * weightSum - BigInt(total) * BigInt(weights[index] ?? 0);
          const absolute = scaledDifference < 0n ? -scaledDifference : scaledDifference;
          expect(absolute < weightSum).toBe(true);
        });
      }),
    );
  });

  it("gives nothing to zero weights", () => {
    fc.assert(
      fc.property(totals, weightLists, (total, weights) => {
        allocateMinorUnits(total, weights).forEach((part, index) => {
          if (weights[index] === 0) expect(part).toBe(0);
        });
      }),
    );
  });

  it("splits a 250 EUR budget evenly across four items", () => {
    expect(allocateMinorUnits(25_000, [1, 1, 1, 1])).toEqual([6_250, 6_250, 6_250, 6_250]);
  });

  it("gives leftover cents to the earliest items when remainders tie", () => {
    expect(allocateMinorUnits(100, [1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("rejects invalid input", () => {
    expect(() => allocateMinorUnits(-1, [1])).toThrow(RangeError);
    expect(() => allocateMinorUnits(1.5, [1])).toThrow(RangeError);
    expect(() => allocateMinorUnits(100, [])).toThrow(RangeError);
    expect(() => allocateMinorUnits(100, [0, 0])).toThrow(RangeError);
    expect(() => allocateMinorUnits(100, [1, -1])).toThrow(RangeError);
    expect(() => allocateMinorUnits(100, [0.5, 1])).toThrow(RangeError);
  });
});

describe("MoneySchema", () => {
  it("accepts integer minor units with an ISO 4217 code", () => {
    expect(MoneySchema.safeParse({ amountMinor: 25_000, currency: "EUR" }).success).toBe(true);
  });

  it("rejects fractional amounts and malformed currency codes", () => {
    expect(MoneySchema.safeParse({ amountMinor: 12.5, currency: "EUR" }).success).toBe(false);
    expect(MoneySchema.safeParse({ amountMinor: 1_250, currency: "eur" }).success).toBe(false);
  });
});

describe("formatMoney", () => {
  const normalizeSpaces = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

  it("formats euros for Finnish users", () => {
    expect(normalizeSpaces(formatMoney({ amountMinor: 25_000, currency: "EUR" }))).toBe("250,00 €");
  });

  it("respects currencies without minor units", () => {
    expect(normalizeSpaces(formatMoney({ amountMinor: 1_500, currency: "JPY" }, "en-US"))).toBe(
      "¥1,500",
    );
  });
});
