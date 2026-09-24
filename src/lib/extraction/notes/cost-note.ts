import type { Row } from "../rows";

const COST_WORDS = /\b(freight|handling|surcharge|delivery (?:charge|fee)|cartage|discount)\b/i;
const DIGIT = /\d/;

export function costNote(rows: Row[]): string | undefined {
  return rows.find((row) => COST_WORDS.test(row.text) && !DIGIT.test(row.text))?.text;
}
