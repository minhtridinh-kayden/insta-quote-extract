import { z } from "zod";
import { evidenced } from "./evidence";
import { SectionSchema } from "./section";

const EvidencedNumber = evidenced(z.number());
const EvidencedString = evidenced(z.string());

export const LineItemSchema = z.object({
  id: z.string().regex(/^p\d+-l\d+$/),
  page: z.number().int().positive(),
  section: SectionSchema,
  itemNo: EvidencedNumber.optional(),
  description: EvidencedString,
  quantity: EvidencedNumber.optional(),
  unit: EvidencedString.optional(),
  unitPrice: EvidencedNumber.optional(),
  priceBasis: EvidencedString.optional(),
  lineTotal: EvidencedNumber.optional(),
  extra: z.record(z.string(), EvidencedString),
  refusalIds: z.array(z.string()),
});

export type LineItem = z.infer<typeof LineItemSchema>;
