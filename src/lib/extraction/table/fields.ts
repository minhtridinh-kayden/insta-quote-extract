import type { Evidenced, LineItem } from "@/lib/schema";
import type { ColumnField } from "../columns";
import { fromRuns } from "../evidence";
import { isMissingToken, measurementBasis, missing, parseMoney, parsePrice, parseQuantity } from "../numbers";
import type { TextRun } from "../pdf";
import { joinRuns, type Row } from "../rows";

export type LineValues = Partial<Pick<LineItem, ColumnField | "priceBasis">>;

export type FieldProblem = {
  code: "MISSING_VALUE" | "AMBIGUOUS_NUMBER_FORMAT" | "AMBIGUOUS_UNIT_BASIS";
  raw: string;
  detail: string;
};

export type Cell = { page: number; row: Row; runs: TextRun[] };

type Reading = { values: LineValues; problem?: FieldProblem };

function readText(key: "description" | "unit") {
  return ({ page, row, runs }: Cell): Reading => {
    const raw = joinRuns(runs);
    if (isMissingToken(raw)) return { values: {}, problem: missing(raw) };
    return { values: { [key]: fromRuns(page, row, runs, raw) } };
  };
}

function readNumber(key: "itemNo" | "quantity" | "lineTotal", parse: typeof parseQuantity) {
  return ({ page, row, runs }: Cell): Reading => {
    const parsed = parse(joinRuns(runs));
    if (!parsed.ok) return { values: {}, problem: parsed };
    return { values: { [key]: fromRuns(page, row, runs, parsed.value) } };
  };
}

function readUnitPrice({ page, row, runs }: Cell): Reading {
  const parsed = parsePrice(joinRuns(runs));
  if (!parsed.ok) return { values: {}, problem: parsed };
  const unitPrice = fromRuns(page, row, runs, parsed.value);
  const priceBasis = parsed.basis === undefined ? undefined : fromRuns(page, row, runs, parsed.basis);
  return { values: priceBasis ? { unitPrice, priceBasis } : { unitPrice } };
}

export const FIELD_READERS: Record<ColumnField, (cell: Cell) => Reading> = {
  itemNo: readNumber("itemNo", parseQuantity),
  description: readText("description"),
  quantity: readNumber("quantity", parseQuantity),
  unit: readText("unit"),
  unitPrice: readUnitPrice,
  lineTotal: readNumber("lineTotal", parseMoney),
};

export function readExtra({ page, row, runs }: Cell): { value?: Evidenced<string>; problem?: FieldProblem } {
  const raw = joinRuns(runs);
  if (isMissingToken(raw)) return { problem: missing(raw) };
  const value = fromRuns(page, row, runs, raw);
  if (measurementBasis(raw) !== "unstated") return { value };
  return {
    value,
    problem: { code: "AMBIGUOUS_UNIT_BASIS", raw, detail: `measurement ${JSON.stringify(raw)} has no per-item or total basis` },
  };
}
