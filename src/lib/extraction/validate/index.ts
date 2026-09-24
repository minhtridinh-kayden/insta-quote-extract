import type { LineItem, Refusal } from "@/lib/schema";
import type { CountMention } from "../notes";
import { conflictingCountRefusals } from "./conflicts";
import { lineArithmeticRefusals } from "./line-arithmetic";
import { totalMismatchRefusals, type PageTotals } from "./totals";

export type CrossCheckInput = {
  lines: LineItem[];
  pageTotals: PageTotals[];
  mentions: CountMention[];
};

export function crossCheck({ lines, pageTotals, mentions }: CrossCheckInput): Refusal[] {
  return [
    ...lineArithmeticRefusals(lines),
    ...totalMismatchRefusals(lines, pageTotals),
    ...conflictingCountRefusals(mentions),
  ];
}

export type { PageTotals } from "./totals";
