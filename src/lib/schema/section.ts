import { z } from "zod";

export const SectionSchema = z.enum([
  "packing_list",
  "delivery",
  "summary",
  "returns",
  "credit",
  "acceptance",
  "unknown",
]);

export type Section = z.infer<typeof SectionSchema>;

export const NonDeliverySectionSchema = SectionSchema.extract([
  "summary",
  "returns",
  "credit",
  "acceptance",
]);

export type NonDeliverySection = z.infer<typeof NonDeliverySectionSchema>;
