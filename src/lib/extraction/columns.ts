import { EXTRA_FIELD_PREFIX, type ExtraField, type FieldPath, type LineField } from "@/lib/schema";

export const FIELD_HEADINGS = {
  itemNo: "Item",
  description: "Description",
  quantity: "Qty",
  unit: "Unit",
  unitPrice: "Unit Price",
  lineTotal: "Line Total",
} as const satisfies Partial<Record<LineField, string>>;

export type ColumnField = keyof typeof FIELD_HEADINGS;

export const REQUIRED_HEADER_FIELDS: ColumnField[] = ["itemNo", "description", "quantity"];

export const OPTIONAL_COLUMN_FIELDS: ColumnField[] = ["unit", "unitPrice", "lineTotal"];

const FIELD_BY_HEADING = new Map(
  Object.entries(FIELD_HEADINGS).map(([field, heading]) => [heading.toLowerCase(), field as ColumnField]),
);

export function fieldForHeading(heading: string): ColumnField | ExtraField {
  return FIELD_BY_HEADING.get(heading.toLowerCase()) ?? `${EXTRA_FIELD_PREFIX}${heading}`;
}

export function headingFor(field: FieldPath): string | undefined {
  return FIELD_HEADINGS[field as ColumnField];
}
