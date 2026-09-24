import { z } from "zod";
import { evidenced } from "./evidence";
import { LineItemSchema } from "./line-item";
import { RefusalSchema } from "./refusal";
import { SectionSchema } from "./section";

export const PageStatusSchema = z.enum(["ok", "needs_review", "refused"]);

export type PageStatus = z.infer<typeof PageStatusSchema>;

export const PageSummarySchema = z.object({
  page: z.number().int().positive(),
  status: PageStatusSchema,
  section: z
    .union([evidenced(SectionSchema), z.object({ value: SectionSchema, raw: z.null() })])
    .optional(),
  lineCount: z.number().int().nonnegative(),
});

export type PageSummary = z.infer<typeof PageSummarySchema>;

export const ResultStatusSchema = z.enum(["complete", "needs_review", "nothing_extracted"]);

export type ResultStatus = z.infer<typeof ResultStatusSchema>;

export const ExtractionResultSchema = z.object({
  requestId: z.string().min(1),
  fileName: z.string(),
  pageCount: z.number().int().nonnegative(),
  status: ResultStatusSchema,
  pages: z.array(PageSummarySchema),
  lineItems: z.array(LineItemSchema),
  documentTotals: z.array(evidenced(z.number())),
  refusals: z.array(RefusalSchema),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
