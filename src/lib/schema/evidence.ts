import { z } from "zod";

export const BBoxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const EvidenceSchema = z.object({
  page: z.number().int().positive(),
  sourceText: z.string().min(1),
  bbox: BBoxSchema.optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export type Evidenced<T> = {
  value: T;
  raw: string;
  evidence: Evidence;
  source: "document";
};

export function evidenced<T extends z.ZodType>(value: T) {
  return z
    .object({
      value,
      raw: z.string().min(1),
      evidence: EvidenceSchema,
      source: z.literal("document"),
    })
    .refine((e) => e.evidence.sourceText.includes(e.raw), {
      message: "raw must be a substring of evidence.sourceText",
      path: ["raw"],
    });
}
