import { z } from "zod";
import { evidenced } from "./evidence";

export const RefusalCodeSchema = z.enum([
  "NOT_A_PDF",
  "ENCRYPTED",
  "EMPTY_DOCUMENT",
  "FILE_TOO_LARGE",
  "NO_TEXT_LAYER",
  "PAGE_PARSE_FAILED",
  "UNRECOGNISED_LAYOUT",
  "NON_DELIVERY_SECTION",
  "COLUMN_NOT_PRESENT",
  "MISSING_VALUE",
  "AMBIGUOUS_NUMBER_FORMAT",
  "AMBIGUOUS_UNIT_BASIS",
  "LINE_ARITHMETIC_MISMATCH",
  "TOTAL_MISMATCH",
  "CONFLICTING_VALUES",
  "VALUE_NOT_IN_SOURCE",
]);

export type RefusalCode = z.infer<typeof RefusalCodeSchema>;

export const RefusalScopeSchema = z.enum(["document", "page", "line", "field"]);

export type RefusalScope = z.infer<typeof RefusalScopeSchema>;

export const CandidateSchema = evidenced(z.union([z.number(), z.string()]));

export const RefusalSchema = z.object({
  id: z.string().min(1),
  code: RefusalCodeSchema,
  scope: RefusalScopeSchema,
  page: z.number().int().positive().optional(),
  lineId: z.string().optional(),
  field: z.string().optional(),
  raw: z.string().optional(),
  sourceText: z.string().optional(),
  candidates: z.array(CandidateSchema).optional(),
  userMessage: z.string().min(1),
  suggestedAction: z.string().min(1).optional(),
  technicalDetail: z.string(),
});

export type Refusal = z.infer<typeof RefusalSchema>;
