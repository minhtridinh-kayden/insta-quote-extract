import type { Section } from "@/lib/schema";

export const SECTION_LABELS: Record<Section, string> = {
  packing_list: "Packing list",
  delivery: "Delivery",
  summary: "Summary",
  returns: "Returns note",
  credit: "Credit adjustment",
  acceptance: "Signed acceptance",
  unknown: "Other page",
};
