import type { Evidenced, LineItem, Refusal } from "@/lib/schema";
import { makeRefusal } from "../refusal";
import { moneyCents } from "./cents";

export type PageTotals = {
  page: number;
  totals: Evidenced<number>[];
  costNote?: string;
};

function linesTotalCents(lines: LineItem[]): number | null {
  let sum = 0;
  for (const line of lines) {
    const cents = line.lineTotal ? moneyCents(line.lineTotal) : null;
    if (cents === null) return null;
    sum += cents;
  }
  return sum;
}

export function totalMismatchRefusals(lines: LineItem[], pages: PageTotals[]): Refusal[] {
  return pages.flatMap(({ page, totals, costNote }) => {
    const pageLines = lines.filter((line) => line.page === page);
    const sum = pageLines.length > 0 ? linesTotalCents(pageLines) : null;
    if (sum === null) return [];
    return totals.flatMap((total, i) => {
      if (moneyCents(total) === sum) return [];
      return [
        makeRefusal({
          code: "TOTAL_MISMATCH",
          scope: "document",
          page,
          key: i > 0 ? `t${i + 1}` : undefined,
          raw: total.raw,
          sourceText: total.evidence.sourceText,
          candidates: [total],
          message: { page, totalRaw: total.raw, note: costNote },
          technicalDetail: `line totals on page ${page} do not add up to the printed total`,
        }),
      ];
    });
  });
}
