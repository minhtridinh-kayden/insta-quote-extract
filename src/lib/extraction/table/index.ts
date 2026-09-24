import type { LineItem, Refusal, Section } from "@/lib/schema";
import { makeRefusal } from "../refusal";
import type { Row } from "../rows";
import { bodyRows } from "./body";
import { findTableLayout } from "./layout";
import { buildLine } from "./line";
import { missingColumnRefusals } from "./missing-columns";

export type TableResult = {
  lines: LineItem[];
  refusals: Refusal[];
  tableRows: Set<number>;
};

function unrecognised(page: number, rows: Row[], technicalDetail: string): TableResult {
  return {
    lines: [],
    refusals: [makeRefusal({ code: "UNRECOGNISED_LAYOUT", scope: "page", page, message: { page }, technicalDetail })],
    tableRows: new Set(rows.map((row) => row.index)),
  };
}

function rowRange(first: number, last: number): Set<number> {
  return new Set(Array.from({ length: last - first + 1 }, (_, i) => first + i));
}

export function extractTable(page: number, section: Section, rows: Row[]): TableResult {
  const layout = findTableLayout(rows);
  if (!layout) return unrecognised(page, rows, "no header row with Item, Description and Qty, each heading once");
  const body = bodyRows(rows, layout);
  if (body.length === 0) return unrecognised(page, rows, "header found but no numbered item rows under it");
  const built = body.map((bodyRow, i) => buildLine({ page, section }, bodyRow, i + 1));
  return {
    lines: built.map((b) => b.line),
    refusals: [...missingColumnRefusals(page, layout), ...built.flatMap((b) => b.refusals)],
    tableRows: rowRange(rows[layout.headerIndex].index, body[body.length - 1].row.index),
  };
}

export { findTableLayout, type Column, type TableLayout } from "./layout";
