import type { Evidenced } from "@/lib/schema";
import { fromText } from "../evidence";
import { parseMoney } from "../numbers";
import type { Row } from "../rows";

const TOTAL_ROW = /^Total:?\s*(\$\S+)(?:\s.*)?$/i;

export function printedTotals(page: number, rows: Row[]): Evidenced<number>[] {
  return rows.flatMap((row) => {
    const match = TOTAL_ROW.exec(row.text);
    const money = match && parseMoney(match[1]);
    return money?.ok ? [fromText(page, row, row.text.indexOf(money.raw), money.raw, money.value)] : [];
  });
}
