import type { ExtraField } from "@/lib/schema";
import { fieldForHeading, FIELD_HEADINGS, REQUIRED_HEADER_FIELDS, type ColumnField } from "../columns";
import type { Row } from "../rows";

const COLUMN_MARGIN = 4;

export type Column = {
  heading: string;
  field: ColumnField | ExtraField;
  start: number;
  end: number;
};

export type TableLayout = {
  headerIndex: number;
  columns: Column[];
};

const REQUIRED_HEADINGS = REQUIRED_HEADER_FIELDS.map((field) => FIELD_HEADINGS[field].toLowerCase());

function isHeaderRow(row: Row): boolean {
  const headings = new Set(row.runs.map((run) => run.str.toLowerCase()));
  return REQUIRED_HEADINGS.every((heading) => headings.has(heading));
}

export function findTableLayout(rows: Row[]): TableLayout | null {
  const headerIndex = rows.findIndex(isHeaderRow);
  if (headerIndex < 0) return null;
  const runs = rows[headerIndex].runs;
  const columns = runs.map((run, i) => ({
    heading: run.str,
    field: fieldForHeading(run.str),
    start: i === 0 ? -Infinity : run.x - COLUMN_MARGIN,
    end: i + 1 < runs.length ? runs[i + 1].x - COLUMN_MARGIN : Infinity,
  }));
  const fields = columns.map((column) => column.field);
  if (new Set(fields).size !== fields.length) return null;
  return { headerIndex, columns };
}

export function columnAt(layout: TableLayout, x: number): Column | undefined {
  return layout.columns.find((column) => x >= column.start && x < column.end);
}
