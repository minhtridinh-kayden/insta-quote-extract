import type { Evidenced, FieldPath, LineItem, Refusal } from "@/lib/schema";
import { EXTRA_FIELD_PREFIX } from "@/lib/schema";
import { makeRefusal } from "../refusal";
import type { PageExtraction } from "./types";

export type PageLines = Map<number, Set<string>>;

type Guarded<T> = { value: T; violations: Refusal[] };

type Where = { lineId?: string; field?: FieldPath; label?: string; key?: string };

export function isGrounded(value: Evidenced<unknown>, pageLines: PageLines, page: number): boolean {
  const { evidence } = value;
  return evidence.page === page && evidence.sourceText.includes(value.raw) && (pageLines.get(page)?.has(evidence.sourceText) ?? false);
}

function violation(page: number, where: Where): Refusal {
  return makeRefusal({
    code: "VALUE_NOT_IN_SOURCE",
    scope: where.lineId ? "field" : "page",
    page,
    lineId: where.lineId,
    field: where.field,
    key: where.key,
    message: { page, field: where.field, label: where.label },
    technicalDetail: `a ${where.field ?? where.label ?? "value"} was dropped because its raw text is not on page ${page}`,
  });
}

const LINE_FIELDS = ["itemNo", "description", "quantity", "unit", "unitPrice", "priceBasis", "lineTotal"] as const;

function guardLine(line: LineItem, pageLines: PageLines): Guarded<LineItem> {
  const guarded: LineItem = { ...line, extra: { ...line.extra } };
  const violations: Refusal[] = [];
  for (const field of LINE_FIELDS) {
    const value = guarded[field];
    if (value && !isGrounded(value, pageLines, line.page)) {
      delete guarded[field];
      violations.push(violation(line.page, { lineId: line.id, field }));
    }
  }
  for (const [heading, value] of Object.entries(guarded.extra)) {
    if (!isGrounded(value, pageLines, line.page)) {
      delete guarded.extra[heading];
      violations.push(violation(line.page, { lineId: line.id, field: `${EXTRA_FIELD_PREFIX}${heading}` }));
    }
  }
  return { value: guarded, violations };
}

export function guardLines(lines: LineItem[], pageLines: PageLines): Guarded<LineItem[]> {
  const guarded = lines.map((line) => guardLine(line, pageLines));
  return { value: guarded.map((g) => g.value), violations: guarded.flatMap((g) => g.violations) };
}

export function guardValues<T>(
  page: number,
  items: T[],
  pageLines: PageLines,
  label: string,
  evidenceOf: (item: T) => Evidenced<unknown>,
): Guarded<T[]> {
  const kept: T[] = [];
  const violations: Refusal[] = [];
  items.forEach((item, i) => {
    if (isGrounded(evidenceOf(item), pageLines, page)) kept.push(item);
    else violations.push(violation(page, { label, key: `${label.replaceAll(" ", "-")}${i + 1}` }));
  });
  return { value: kept, violations };
}

export function pageStructureProblem(extraction: PageExtraction): string | null {
  const lines = new Set(extraction.pageLines);
  const onPage: PageLines = new Map([[extraction.page, lines]]);
  const { section } = extraction;
  if (section && section.raw !== null && !isGrounded(section, onPage, extraction.page)) {
    return "page section is not traceable to the page text";
  }
  const refusal = extraction.refusals.find(
    (r) => (r.sourceText !== undefined && !lines.has(r.sourceText)) || (r.raw && r.sourceText && !r.sourceText.includes(r.raw)),
  );
  return refusal ? `refusal ${refusal.id} cites text that is not on the page` : null;
}
