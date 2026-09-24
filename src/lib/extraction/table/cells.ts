import type { TextRun } from "../pdf";
import type { Row } from "../rows";
import { columnAt, type Column, type TableLayout } from "./layout";

export type Cells = Map<Column, TextRun[]>;

export function cellsOf(row: Row, layout: TableLayout): Cells {
  const cells: Cells = new Map(layout.columns.map((column) => [column, []]));
  for (const run of row.runs) {
    const column = columnAt(layout, run.x);
    if (column) cells.get(column)!.push(run);
  }
  return cells;
}
