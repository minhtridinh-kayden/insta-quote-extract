import type { Evidenced, Section } from "@/lib/schema";
import { fromRow } from "./evidence";
import type { Row } from "./rows";

const SUBTITLE_ROW = 1;

const SECTION_RULES: { pattern: RegExp; section: Section }[] = [
  { pattern: /summary/i, section: "summary" },
  { pattern: /return/i, section: "returns" },
  { pattern: /credit/i, section: "credit" },
  { pattern: /acceptance/i, section: "acceptance" },
  { pattern: /site \d+ of \d+/i, section: "delivery" },
  { pattern: /packing list/i, section: "packing_list" },
];

export type PageSection = Evidenced<Section> | { value: Section; raw: null };

export function classifySubtitle(subtitle: string): Section {
  return SECTION_RULES.find((rule) => rule.pattern.test(subtitle))?.section ?? "unknown";
}

export function pageSection(page: number, rows: Row[]): PageSection {
  const subtitle = rows[SUBTITLE_ROW];
  if (!subtitle) return { value: "unknown", raw: null };
  return fromRow(page, subtitle, classifySubtitle(subtitle.text));
}
