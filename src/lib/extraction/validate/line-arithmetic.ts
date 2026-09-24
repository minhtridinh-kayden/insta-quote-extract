import type { LineItem, Refusal } from "@/lib/schema";
import { lineLabel } from "../line-label";
import { makeRefusal } from "../refusal";
import { moneyCents, priceCents, quantityFraction } from "./cents";

function isConsistent(line: Required<Pick<LineItem, "quantity" | "unitPrice" | "lineTotal">>): boolean {
  const unit = priceCents(line.unitPrice);
  const total = moneyCents(line.lineTotal);
  if (unit === null || total === null) return true;
  const { numerator, denominator } = quantityFraction(line.quantity);
  return numerator * unit === total * denominator;
}

export function lineArithmeticRefusals(lines: LineItem[]): Refusal[] {
  return lines.flatMap((line) => {
    const { quantity, unitPrice, lineTotal } = line;
    if (!quantity || !unitPrice || !lineTotal || isConsistent({ quantity, unitPrice, lineTotal })) return [];
    const lineNo = Number(line.id.split("-l")[1]);
    return [
      makeRefusal({
        code: "LINE_ARITHMETIC_MISMATCH",
        scope: "line",
        page: line.page,
        lineId: line.id,
        sourceText: lineTotal.evidence.sourceText,
        candidates: [quantity, unitPrice, lineTotal],
        message: {
          page: line.page,
          description: lineLabel(line.description, line.itemNo, lineNo),
          quantityRaw: quantity.raw,
          unitPriceRaw: unitPrice.raw,
          lineTotalRaw: lineTotal.raw,
        },
        technicalDetail: `quantity × unit price ≠ line total for ${line.id}`,
      }),
    ];
  });
}
