import type { Evidenced } from "@/lib/schema";
import { parseMoney, parsePrice } from "../numbers";

export type Fraction = { numerator: number; denominator: number };

export function moneyCents(value: Evidenced<number>): number | null {
  const parsed = parseMoney(value.raw);
  return parsed.ok ? parsed.cents : null;
}

export function priceCents(value: Evidenced<number>): number | null {
  const parsed = parsePrice(value.raw);
  return parsed.ok ? parsed.cents : null;
}

export function quantityFraction(value: Evidenced<number>): Fraction {
  const [whole, decimals = ""] = value.raw.replaceAll(",", "").split(".");
  return { numerator: Number(whole + decimals), denominator: 10 ** decimals.length };
}
