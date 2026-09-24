import type { FieldPath, LineField, NonDeliverySection, RefusalCode } from "@/lib/schema";

export type RefusalCopy = {
  userMessage: string;
  suggestedAction: string;
};

export type LineRef = {
  page: number;
  description: string;
};

export type FieldRef = LineRef & {
  field: FieldPath;
};

export type MessageInputs = {
  NOT_A_PDF: { fileName: string };
  ENCRYPTED: Record<string, never>;
  EMPTY_DOCUMENT: Record<string, never>;
  FILE_TOO_LARGE: { maxMb: number };
  NO_TEXT_LAYER: { page: number };
  PAGE_PARSE_FAILED: { page: number };
  UNRECOGNISED_LAYOUT: { page: number };
  NON_DELIVERY_SECTION: { page: number; section: NonDeliverySection };
  COLUMN_NOT_PRESENT: { page: number; field: LineField };
  MISSING_VALUE: FieldRef & { raw?: string };
  AMBIGUOUS_NUMBER_FORMAT: FieldRef & { raw: string };
  AMBIGUOUS_UNIT_BASIS: FieldRef & { raw: string };
  LINE_ARITHMETIC_MISMATCH: LineRef & {
    quantityRaw: string;
    unitPriceRaw: string;
    lineTotalRaw: string;
  };
  TOTAL_MISMATCH: { page: number; totalRaw: string; note?: string };
  CONFLICTING_VALUES: { countNoun: string; raws: string[] };
  VALUE_NOT_IN_SOURCE: { page: number; field: FieldPath };
};

export type MessageBuilder<C extends RefusalCode> = (input: MessageInputs[C]) => RefusalCopy;

export type MessageBuilders<C extends RefusalCode = RefusalCode> = {
  [K in C]: MessageBuilder<K>;
};
