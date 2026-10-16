import { z } from "zod";

/** ISO 4217 alphabetic currency code, for example "EUR". */
export const CurrencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, "Expected an ISO 4217 currency code such as EUR");
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

/**
 * Money is an integer number of minor units (cents for EUR) plus a currency code.
 * Amounts are never stored or calculated as floating-point numbers.
 */
export const MoneySchema = z.object({
  amountMinor: z.int(),
  currency: CurrencyCodeSchema,
});
export type Money = z.infer<typeof MoneySchema>;

/**
 * Splits `totalMinor` into integer parts proportional to `weights` (largest-remainder method).
 *
 * - The parts always add up to exactly `totalMinor`.
 * - Each part differs from its exact proportional share by less than one minor unit.
 * - A zero weight always gets zero.
 * - Leftover units go to the largest remainders; ties go to the earlier index, so the result
 *   is deterministic.
 */
export function allocateMinorUnits(totalMinor: number, weights: readonly number[]): number[] {
  if (!Number.isSafeInteger(totalMinor) || totalMinor < 0) {
    throw new RangeError("totalMinor must be a non-negative safe integer");
  }
  if (weights.length === 0) {
    throw new RangeError("weights must not be empty");
  }
  if (!weights.every((weight) => Number.isSafeInteger(weight) && weight >= 0)) {
    throw new RangeError("weights must be non-negative safe integers");
  }

  const total = BigInt(totalMinor);
  const exactWeights = weights.map((weight) => BigInt(weight));
  const weightSum = exactWeights.reduce((sum, weight) => sum + weight, 0n);
  if (weightSum === 0n) {
    throw new RangeError("at least one weight must be positive");
  }

  const floors = exactWeights.map((weight) => (total * weight) / weightSum);
  const leftover = Number(total - floors.reduce((sum, part) => sum + part, 0n));
  const byRemainder = exactWeights
    .map((weight, index) => ({ index, remainder: (total * weight) % weightSum }))
    .sort((a, b) =>
      a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
    );
  const bumped = new Set(byRemainder.slice(0, leftover).map(({ index }) => index));

  return floors.map((part, index) => Number(part + (bumped.has(index) ? 1n : 0n)));
}

/**
 * Formats money for display, for example 25000 EUR as "250,00 €" in fi-FI. The number of minor
 * units per major unit comes from the currency's ISO 4217 digits via Intl.
 */
export function formatMoney(money: Money, locale = "fi-FI"): string {
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency: money.currency });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(money.amountMinor / 10 ** fractionDigits);
}
