import { z } from "zod";

export const LineFieldSchema = z.enum([
  "itemNo",
  "description",
  "quantity",
  "unit",
  "unitPrice",
  "priceBasis",
  "lineTotal",
]);

export type LineField = z.infer<typeof LineFieldSchema>;

export const EXTRA_FIELD_PREFIX = "extra.";

export type ExtraField = `${typeof EXTRA_FIELD_PREFIX}${string}`;

export type FieldPath = LineField | ExtraField;

export function isExtraField(value: unknown): value is ExtraField {
  return typeof value === "string" && value.startsWith(EXTRA_FIELD_PREFIX) && value.length > EXTRA_FIELD_PREFIX.length;
}

export const FieldPathSchema = z.union([LineFieldSchema, z.custom<ExtraField>(isExtraField)]);
