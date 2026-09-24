import { EXTRA_FIELD_PREFIX, isExtraField, type ExtractionResult, type FieldPath, type LineItem, type Refusal, type Section } from "@/lib/schema";
import { groupBy } from "./group-by";

export type LineGroup = {
  page: number;
  section: Section;
  lines: LineItem[];
  extraHeadings: string[];
};

export type FieldRefusals = (line: LineItem, field: FieldPath) => Refusal | undefined;

export function fieldRefusals(refusals: Refusal[]): FieldRefusals {
  const byId = new Map(refusals.map((refusal) => [refusal.id, refusal]));
  return (line, field) => line.refusalIds.map((id) => byId.get(id)).find((refusal) => refusal?.field === field);
}

function refusedExtraHeadings(lines: LineItem[], refusals: Refusal[]): string[] {
  const lineIds = new Set(lines.map((line) => line.id));
  return refusals
    .filter((refusal) => refusal.lineId && lineIds.has(refusal.lineId) && isExtraField(refusal.field))
    .map((refusal) => refusal.field!.slice(EXTRA_FIELD_PREFIX.length));
}

export function groupLinesByPage(result: ExtractionResult): LineGroup[] {
  return [...groupBy(result.lineItems, (line) => line.page)].map(([page, lines]) => ({
    page,
    section: lines[0].section,
    lines,
    extraHeadings: [
      ...new Set([...lines.flatMap((line) => Object.keys(line.extra)), ...refusedExtraHeadings(lines, result.refusals)]),
    ],
  }));
}
