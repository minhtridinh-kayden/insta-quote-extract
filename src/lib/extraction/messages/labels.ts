import type { NonDeliverySection } from "@/lib/schema";

const FIELD_LABELS: Record<string, string> = {
  itemNo: "item number",
  description: "description",
  quantity: "quantity",
  unit: "unit",
  unitPrice: "unit price",
  priceBasis: "price basis",
  lineTotal: "line total",
};

const COLUMN_HEADINGS: Record<string, string> = {
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

const EXTRA_PREFIX = "extra.";

export function fieldLabel(field: string): string {
  if (field.startsWith(EXTRA_PREFIX)) return field.slice(EXTRA_PREFIX.length).toLowerCase();
  return FIELD_LABELS[field] ?? field;
}

export function columnHeading(field: string): string {
  return COLUMN_HEADINGS[field] ?? fieldLabel(field);
}

export function sectionName(section: NonDeliverySection): string {
  return SECTION_NAMES[section];
}
