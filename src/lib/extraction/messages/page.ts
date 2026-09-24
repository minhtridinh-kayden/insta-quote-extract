import { columnHeading, fieldLabel, sectionName } from "./labels";
import type { MessageBuilders } from "./types";

export const pageMessages: MessageBuilders<
  | "NO_TEXT_LAYER"
  | "PAGE_PARSE_FAILED"
  | "UNRECOGNISED_LAYOUT"
  | "NON_DELIVERY_SECTION"
  | "COLUMN_NOT_PRESENT"
> = {
  NO_TEXT_LAYER: ({ page }) => ({
    userMessage: `Page ${page} is a scanned image, so we couldn't read any text on it. Nothing from page ${page} is included.`,
    suggestedAction: "Upload the original digital PDF, or enter those items by hand.",
  }),
  PAGE_PARSE_FAILED: ({ page }) => ({
    userMessage: `We couldn't read page ${page} of this file. The other pages were read as normal, but nothing from page ${page} is included.`,
    suggestedAction: `Check page ${page} yourself and enter its items by hand, or try uploading the file again.`,
  }),
  UNRECOGNISED_LAYOUT: ({ page }) => ({
    userMessage: `Page ${page} doesn't have an item table laid out in a way we recognise, so we haven't taken anything from it rather than guess.`,
    suggestedAction: `Check page ${page} yourself and enter any items by hand.`,
  }),
  NON_DELIVERY_SECTION: ({ page, section }) => ({
    userMessage: `Page ${page} is ${sectionName(section)}. It lists items, but doesn't say whether they were delivered, returned or credited, so we've kept them separate from the delivered items.`,
    suggestedAction: "Check this page yourself before adding any of these items to a quote.",
  }),
  COLUMN_NOT_PRESENT: ({ page, field }) => ({
    userMessage: `Page ${page} has no ${columnHeading(field)} column, so no ${fieldLabel(field)} is shown for its items. We haven't worked one out from the other figures.`,
    suggestedAction: `If you need the ${fieldLabel(field)}, confirm it with the supplier.`,
  }),
};
