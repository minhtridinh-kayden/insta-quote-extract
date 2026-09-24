import type { LineItem, PageSummary, Refusal } from "@/lib/schema";
import { readPdf, type PageRead } from "../pdf";
import { crossCheck } from "../validate";
import { documentRefusal } from "./document-refusal";
import { linkRefusals } from "./link";
import { noTextLayer, pageParseFailed } from "./page-refusals";
import { isNonDeliveryPage, processTextPage } from "./process-page";
import { guardLines, guardValues, pageStructureProblem, type PageLines } from "./provenance";
import { pageStatus, resultStatus } from "./status";
import type { PageExtraction, PageProcessor, PipelineInput, PipelineOutcome } from "./types";

const emptyPage = (page: number): PageExtraction => ({ page, lines: [], refusals: [], totals: [], mentions: [], pageLines: [] });

const failedPage = (page: number, detail: string): PageExtraction => ({
  ...emptyPage(page),
  refusals: [pageParseFailed(page, detail)],
});

function extractPage(read: PageRead, processPage: PageProcessor): PageExtraction {
  if (read.kind === "no_text") return { ...emptyPage(read.page), refusals: [noTextLayer(read.page)] };
  if (read.kind === "failed") return failedPage(read.page, read.detail);
  try {
    const extraction = processPage(read.page, read.runs);
    const problem = pageStructureProblem(extraction);
    return problem ? failedPage(read.page, problem) : extraction;
  } catch (error) {
    return failedPage(read.page, error instanceof Error ? error.message : String(error));
  }
}

function combine<T>(guarded: { value: T[]; violations: Refusal[] }[]) {
  return { value: guarded.flatMap((g) => g.value), violations: guarded.flatMap((g) => g.violations) };
}

function pageSummaries(pages: PageExtraction[], lines: LineItem[], refusals: Refusal[]): PageSummary[] {
  const linesByPage = Map.groupBy(lines, (line) => line.page);
  const refusalsByPage = Map.groupBy(refusals, (refusal) => refusal.page ?? 0);
  return pages.map((p) => {
    const pageLines = linesByPage.get(p.page) ?? [];
    return {
      page: p.page,
      status: pageStatus(pageLines.length, refusalsByPage.get(p.page)?.length ?? 0),
      ...(p.section && { section: p.section }),
      lineCount: pageLines.length,
    };
  });
}

export async function extractDocument(bytes: Uint8Array, input: PipelineInput): Promise<PipelineOutcome> {
  const read = await readPdf(bytes);
  if (!read.ok) return { kind: "refused", refusal: documentRefusal(read.failure, input.fileName) };

  const pages = read.pages.map((page) => extractPage(page, input.processPage ?? processTextPage));
  const pageLines: PageLines = new Map(pages.map((p) => [p.page, new Set(p.pageLines)]));

  const lines = guardLines(pages.flatMap((p) => p.lines), pageLines);
  const totals = combine(pages.map((p) => guardValues(p.page, p.totals, pageLines, "printed total", (total) => total)));
  const mentions = combine(
    pages
      .filter((p) => !isNonDeliveryPage(p))
      .map((p) => guardValues(p.page, p.mentions, pageLines, "count", (mention) => mention.count)),
  );
  const totalsByPage = Map.groupBy(totals.value, (total) => total.evidence.page);

  const checks = crossCheck({
    lines: lines.value,
    pageTotals: pages.map(({ page, costNote }) => ({ page, costNote, totals: totalsByPage.get(page) ?? [] })),
    mentions: mentions.value,
  });
  const refusals = [
    ...pages.flatMap((p) => p.refusals),
    ...checks,
    ...lines.violations,
    ...totals.violations,
    ...mentions.violations,
  ];
  const lineItems = linkRefusals(lines.value, refusals);

  return {
    kind: "result",
    result: {
      requestId: input.requestId,
      fileName: input.fileName,
      pageCount: pages.length,
      status: resultStatus(lineItems, refusals),
      pages: pageSummaries(pages, lineItems, refusals),
      lineItems,
      documentTotals: totals.value,
      refusals,
    },
  };
}

export { processTextPage } from "./process-page";
export type { PageExtraction, PageProcessor, PipelineInput, PipelineOutcome } from "./types";
