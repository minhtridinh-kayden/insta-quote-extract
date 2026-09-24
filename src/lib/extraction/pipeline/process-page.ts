import { NonDeliverySectionSchema } from "@/lib/schema";
import { readNotes } from "../notes";
import type { TextRun } from "../pdf";
import { groupRows } from "../rows";
import { pageSection } from "../section";
import { extractTable } from "../table";
import { nonDeliverySection } from "./page-refusals";
import type { PageExtraction } from "./types";

export function processTextPage(page: number, runs: TextRun[]): PageExtraction {
  const rows = groupRows(runs);
  const section = pageSection(page, rows);
  const table = extractTable(page, section.value, rows);
  const notes = readNotes(page, rows, table.tableRows);
  const nonDelivery = NonDeliverySectionSchema.safeParse(section.value);
  const sectionRefusals =
    nonDelivery.success && section.raw !== null ? [nonDeliverySection(page, nonDelivery.data, section.raw)] : [];
  return {
    page,
    section,
    lines: table.lines,
    refusals: [...sectionRefusals, ...table.refusals],
    totals: notes.totals,
    mentions: notes.mentions,
    costNote: notes.costNote,
    pageLines: rows.map((row) => row.text),
  };
}

export function isNonDeliveryPage(extraction: PageExtraction): boolean {
  return NonDeliverySectionSchema.safeParse(extraction.section?.value).success;
}
