import { NonDeliverySectionSchema, type ExtractionResult } from "@/lib/schema";
import { plural } from "./plural";

export type Summary = { headline: string; detail?: string };

function nothingExtracted(result: ExtractionResult): Summary {
  const allScanned = result.refusals.length > 0 && result.refusals.every((r) => r.code === "NO_TEXT_LAYER");
  if (allScanned) {
    const what = result.pageCount === 1 ? "This file is a scanned image" : "Every page in this file is a scanned image";
    return {
      headline: `${what}, so there was no text for us to read. Nothing was extracted.`,
      detail: "Upload the original digital PDF from the supplier, or enter the items by hand.",
    };
  }
  return {
    headline: "We couldn't read any items from this file. Nothing was extracted.",
    detail: "The reasons are listed below, page by page.",
  };
}

export function summarise(result: ExtractionResult): Summary {
  if (result.status === "nothing_extracted") return nothingExtracted(result);

  const lines = result.lineItems.length;
  const pagesWithLines = result.pages.filter((p) => p.lineCount > 0).length;
  const from = result.pageCount === 1 ? "this page" : `${pagesWithLines} of ${result.pageCount} pages`;
  const attention =
    result.refusals.length === 0
      ? "Nothing needs your attention."
      : `${plural(result.refusals.length, "thing needs", "things need")} your attention.`;

  const nonDelivery = result.lineItems.filter((l) => NonDeliverySectionSchema.safeParse(l.section).success).length;
  return {
    headline: `We read ${plural(lines, "item")} from ${from}. ${attention}`,
    detail:
      nonDelivery > 0
        ? `${plural(nonDelivery, "item is", "items are")} on summary, returns, credit or acceptance pages, so ${nonDelivery === 1 ? "it isn't" : "they aren't"} counted as delivered.`
        : undefined,
  };
}
