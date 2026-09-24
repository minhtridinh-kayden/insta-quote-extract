import { isMissingToken } from "./missing";
import { ambiguous, missing } from "./refusals";
import type { Parsed } from "./types";

const INTEGER = /^\d+$|^\d{1,3}(?:,\d{3})+$/;
const THOUSANDS_OR_DECIMAL = /^[1-9]\d{0,2}\.\d{3}$/;
const DECIMAL = /^\d+\.\d+$/;

export function parseQuantity(raw: string): Parsed<{ value: number }> {
  if (isMissingToken(raw)) return missing(raw);
  if (INTEGER.test(raw)) return { ok: true, raw, value: Number(raw.replaceAll(",", "")) };
  if (THOUSANDS_OR_DECIMAL.test(raw)) {
    return ambiguous(raw, `${JSON.stringify(raw)} could be a thousands separator or a decimal point`);
  }
  if (DECIMAL.test(raw)) return { ok: true, raw, value: Number(raw) };
  return ambiguous(raw, `not a plain quantity: ${JSON.stringify(raw)}`);
}
