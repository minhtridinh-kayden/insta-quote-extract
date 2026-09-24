import type { Refusal } from "@/lib/schema";
import { FIELD_HEADINGS, OPTIONAL_COLUMN_FIELDS } from "../columns";
import { makeRefusal } from "../refusal";
import type { TableLayout } from "./layout";

export function missingColumnRefusals(page: number, layout: TableLayout): Refusal[] {
  const present = new Set(layout.columns.map((column) => column.field));
  return OPTIONAL_COLUMN_FIELDS.filter((field) => !present.has(field)).map((field) =>
    makeRefusal({
      code: "COLUMN_NOT_PRESENT",
      scope: "page",
      page,
      field,
      message: { page, field },
      technicalDetail: `table header has no "${FIELD_HEADINGS[field]}" column`,
    }),
  );
}
