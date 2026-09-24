import type { Evidenced } from "@/lib/schema";
import { fromText } from "../evidence";
import type { Row } from "../rows";

export const COUNT_NOUNS = [
  { singular: "pallet", plural: "pallets" },
  { singular: "bag", plural: "bags" },
  { singular: "box", plural: "boxes" },
  { singular: "roll", plural: "rolls" },
  { singular: "bundle", plural: "bundles" },
  { singular: "crate", plural: "crates" },
  { singular: "pack", plural: "packs" },
  { singular: "sheet", plural: "sheets" },
  { singular: "carton", plural: "cartons" },
] as const;

export type CountNoun = (typeof COUNT_NOUNS)[number];

export type CountMention = { noun: CountNoun; count: Evidenced<number> };

const NOUN_BY_FORM = new Map<string, CountNoun>(
  COUNT_NOUNS.flatMap((noun) => [[noun.singular, noun], [noun.plural, noun]] as const),
);

const MENTION = new RegExp(
  String.raw`(?<![\d.,])\b(\d{1,3}(?:,\d{3})+|\d+)\s+(${[...NOUN_BY_FORM.keys()].join("|")})\b`,
  "gi",
);

export function countMentions(page: number, rows: Row[]): CountMention[] {
  return rows.flatMap((row) =>
    [...row.text.matchAll(MENTION)].map((match) => ({
      noun: NOUN_BY_FORM.get(match[2].toLowerCase())!,
      count: fromText(page, row, match.index, match[0], Number(match[1].replaceAll(",", ""))),
    })),
  );
}
