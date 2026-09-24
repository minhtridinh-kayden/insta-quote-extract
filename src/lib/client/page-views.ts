import { EXTRA_FIELD_PREFIX, isExtraField, type ExtractionResult, type LineItem, type Refusal } from "@/lib/schema";
import { sortRefusals } from "./attention";
import { groupBy } from "./group-by";
import { pageChip, type PageChip } from "./page-chip";
import { SECTION_LABELS } from "./sections";

export type PageView = {
  page: number;
  chip: PageChip;
  sectionLabel?: string;
  pageNotes: Refusal[];
  lines: LineItem[];
  lineNotes: Map<string, Refusal[]>;
  extraHeadings: string[];
};

export function pagesOf(refusal: Refusal): number[] {
  if (refusal.page !== undefined) return [refusal.page];
  return [...new Set((refusal.candidates ?? []).map((candidate) => candidate.evidence.page))];
}

function extraHeadings(lines: LineItem[], lineNotes: Refusal[]): string[] {
  const printed = lines.flatMap((line) => Object.keys(line.extra));
  const refused = lineNotes.flatMap((refusal) =>
    isExtraField(refusal.field) ? [refusal.field.slice(EXTRA_FIELD_PREFIX.length)] : [],
  );
  return [...new Set([...printed, ...refused])];
}

export function pageViews(result: ExtractionResult): PageView[] {
  const linesByPage = groupBy(result.lineItems, (line) => line.page);
  const lineRefusals = groupBy(
    result.refusals.filter((refusal) => refusal.lineId !== undefined),
    (refusal) => refusal.lineId!,
  );
  const pageRefusals = sortRefusals(result.refusals.filter((refusal) => refusal.lineId === undefined));

  return result.pages.map((summary) => {
    const lines = linesByPage.get(summary.page) ?? [];
    const lineNotes = new Map(lines.map((line) => [line.id, lineRefusals.get(line.id) ?? []]));
    return {
      page: summary.page,
      chip: pageChip(summary, result.refusals),
      sectionLabel: summary.section ? SECTION_LABELS[summary.section.value] : undefined,
      pageNotes: pageRefusals.filter((refusal) => pagesOf(refusal).includes(summary.page)),
      lines,
      lineNotes,
      extraHeadings: extraHeadings(lines, [...lineNotes.values()].flat()),
    };
  });
}

export function pageAnchor(page: number): string {
  return `page-${page}`;
}
