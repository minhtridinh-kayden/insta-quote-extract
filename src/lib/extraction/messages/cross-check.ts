import { joinAnd, onPage, quote } from "./format";
import type { MessageBuilders } from "./types";

export const crossCheckMessages: MessageBuilders<
  "LINE_ARITHMETIC_MISMATCH" | "TOTAL_MISMATCH" | "CONFLICTING_VALUES"
> = {
  LINE_ARITHMETIC_MISMATCH: ({ page, description, quantityRaw, unitPriceRaw, lineTotalRaw }) => ({
    userMessage: `${quote(description)} ${onPage(page)} shows a quantity of ${quantityRaw} at ${unitPriceRaw}, but the line total printed is ${lineTotalRaw}, and those don't match. We've kept all three figures as printed.`,
    suggestedAction: "Check this line with the supplier before using it in a quote.",
  }),
  TOTAL_MISMATCH: ({ page, totalRaw, note }) => ({
    userMessage: [
      `The items ${onPage(page)} don't add up to the Total printed on the page (${totalRaw}).`,
      note && `The page says ${quote(note)}, but no separate amount is shown for it.`,
      "We haven't guessed which figure is right.",
    ]
      .filter(Boolean)
      .join(" "),
    suggestedAction: "Check with the supplier before using this total in a quote.",
  }),
  CONFLICTING_VALUES: ({ countNoun, raws }) => ({
    userMessage: `The number of ${countNoun} doesn't match: the document says ${joinAnd(raws.map(quote))} in different places. We haven't picked one.`,
    suggestedAction: `Check with the supplier or driver which number of ${countNoun} is correct.`,
  }),
};
