import type { NonDeliverySection, Refusal } from "@/lib/schema";
import { makeRefusal } from "../refusal";

export function noTextLayer(page: number): Refusal {
  return makeRefusal({
    code: "NO_TEXT_LAYER",
    scope: "page",
    page,
    message: { page },
    technicalDetail: `page ${page} has no text runs (scanned image)`,
  });
}

export function pageParseFailed(page: number, detail: string): Refusal {
  return makeRefusal({
    code: "PAGE_PARSE_FAILED",
    scope: "page",
    page,
    message: { page },
    technicalDetail: `page ${page} could not be processed: ${detail}`,
  });
}

export function nonDeliverySection(page: number, section: NonDeliverySection, subtitle: string): Refusal {
  return makeRefusal({
    code: "NON_DELIVERY_SECTION",
    scope: "page",
    page,
    raw: subtitle,
    sourceText: subtitle,
    message: { page, section },
    technicalDetail: `page subtitle classified as ${section}`,
  });
}
