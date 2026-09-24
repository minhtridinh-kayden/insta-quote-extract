import type { CellRefusal } from "./types";

export function missing(raw: string): CellRefusal {
  return { ok: false, code: "MISSING_VALUE", raw, detail: `missing-value token ${JSON.stringify(raw)}` };
}

export function ambiguous(raw: string, reason: string): CellRefusal {
  return { ok: false, code: "AMBIGUOUS_NUMBER_FORMAT", raw, detail: reason };
}
