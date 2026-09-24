import { isMissingToken } from "./missing";
import { ambiguous, missing } from "./refusals";
import type { Parsed } from "./types";

export type Money = { value: number; cents: number };
export type Price = Money & { basis?: string };

const MONEY = /^\$(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})$/;
const PRICE_WITH_BASIS = /^(\S+)\s*\/\s*([a-z]+)$/;

export function parseMoney(raw: string): Parsed<Money> {
  if (isMissingToken(raw)) return missing(raw);
  const match = MONEY.exec(raw);
  if (!match) return ambiguous(raw, `not a money amount like $1,234.56: ${JSON.stringify(raw)}`);
  const cents = Number(match[1].replaceAll(",", "")) * 100 + Number(match[2]);
  return { ok: true, raw, value: cents / 100, cents };
}

export function parsePrice(raw: string): Parsed<Price> {
  if (isMissingToken(raw)) return missing(raw);
  const withBasis = PRICE_WITH_BASIS.exec(raw);
  if (!withBasis) return parseMoney(raw);
  const money = parseMoney(withBasis[1]);
  if (!money.ok) return { ...money, raw };
  return { ...money, raw, basis: withBasis[2] };
}
