import { EXTRA_FIELD_PREFIX, isExtraField, type FieldPath, type LineField, type NonDeliverySection } from "@/lib/schema";

const FIELD_LABELS: Record<LineField, string> = {
  itemNo: "item number",
  description: "description",
  quantity: "quantity",
  unit: "unit",
  unitPrice: "unit price",
  priceBasis: "price basis",
  lineTotal: "line total",
};

const COLUMN_HEADINGS: Partial<Record<LineField, string>> = {
  quantity: "Qty",
  unit: "Unit",
  unitPrice: "Unit Price",
  lineTotal: "Line Total",
};

const SECTION_NAMES: Record<NonDeliverySection, string> = {
  summary: "a summary page",
  returns: "a Returns Note",
  credit: "a Credit Adjustment",
  acceptance: "a Signed Acceptance",
};

export function fieldLabel(field: FieldPath): string {
  if (isExtraField(field)) return field.slice(EXTRA_FIELD_PREFIX.length).toLowerCase();
  return FIELD_LABELS[field];
}

export function columnHeading(field: LineField): string {
  return COLUMN_HEADINGS[field] ?? fieldLabel(field);
}

export function sectionName(section: NonDeliverySection): string {
  return SECTION_NAMES[section];
}
