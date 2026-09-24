import { joinRuns, type Row } from "../rows";
import { cellsOf, type Cells } from "./cells";
import type { TableLayout } from "./layout";

const RULE_ROW = /^[-\s]+$/;
const ITEM_NUMBER = /^[1-9]\d*$/;

export type BodyRow = { row: Row; cells: Cells };

export function bodyRows(rows: Row[], layout: TableLayout): BodyRow[] {
  const itemColumn = layout.columns.find((column) => column.field === "itemNo");
  const body: BodyRow[] = [];
  for (const row of rows.slice(layout.headerIndex + 1)) {
    if (body.length === 0 && RULE_ROW.test(row.text)) continue;
    const cells = cellsOf(row, layout);
    if (!itemColumn || !ITEM_NUMBER.test(joinRuns(cells.get(itemColumn) ?? []))) break;
    body.push({ row, cells });
  }
  return body;
}
