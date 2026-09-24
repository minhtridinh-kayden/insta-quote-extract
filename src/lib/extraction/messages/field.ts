import { onPage, quote } from "./format";
import { fieldLabel } from "./labels";
import type { FieldRef, MessageBuilders } from "./types";

function where({ field, description, page }: FieldRef): string {
  return `The ${fieldLabel(field)} for ${quote(description)} ${onPage(page)}`;
}

export const fieldMessages: MessageBuilders<
  "MISSING_VALUE" | "AMBIGUOUS_NUMBER_FORMAT" | "AMBIGUOUS_UNIT_BASIS" | "VALUE_NOT_IN_SOURCE"
> = {
  MISSING_VALUE: (input) => ({
    userMessage: input.raw
      ? `${where(input)} isn't given (it says ${quote(input.raw)}), so we've left it out.`
      : `${where(input)} is blank, so we've left it out.`,
    suggestedAction: "Ask the supplier for this figure, or enter it by hand.",
  }),
  AMBIGUOUS_NUMBER_FORMAT: (input) => ({
    userMessage: `${where(input)} is printed as ${quote(input.raw)}, which could be read more than one way. We've left it out rather than guess.`,
    suggestedAction: "Check the original document and enter the right figure by hand.",
  }),
  AMBIGUOUS_UNIT_BASIS: (input) => ({
    userMessage: `${where(input)} is ${quote(input.raw)}, but it doesn't say whether that's for each item or for the whole line. We've kept it exactly as printed.`,
    suggestedAction: `Check with the supplier if the ${fieldLabel(input.field)} matters for this job.`,
  }),
  VALUE_NOT_IN_SOURCE: ({ page, field, label: what }) => {
    const label = field ? fieldLabel(field) : (what ?? "value");
    return {
      userMessage: `We found a ${label} ${onPage(page)} but couldn't match it back to the text on the page, so we've left it out.`,
      suggestedAction: `Check the ${label} on the original document and enter it by hand.`,
    };
  },
};
