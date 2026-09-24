import type { Evidenced } from "@/lib/schema";
import type { Row } from "../rows";
import { costNote } from "./cost-note";
import { countMentions, type CountMention } from "./mentions";
import { printedTotals } from "./totals";

export type PageNotes = {
  totals: Evidenced<number>[];
  mentions: CountMention[];
  costNote?: string;
};

export function readNotes(page: number, rows: Row[], tableRows: Set<number>): PageNotes {
  const noteRows = rows.filter((row) => !tableRows.has(row.index));
  return {
    totals: printedTotals(page, noteRows),
    mentions: countMentions(page, noteRows),
    costNote: costNote(noteRows),
  };
}

export { COUNT_NOUNS, type CountMention, type CountNoun } from "./mentions";
