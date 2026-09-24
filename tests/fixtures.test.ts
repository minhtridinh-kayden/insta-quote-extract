import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractDocument } from "@/lib/extraction/pipeline";
import type { ExtractionResult, Refusal } from "@/lib/schema";
import { allEvidenced } from "./helpers/evidenced";
import { EXPECTED_FIXTURES, expectedFor, type ExpectedRefusal } from "./helpers/expected";
import { FIXTURE_DIR, fixtureBytes } from "./helpers/fixtures";
import { asExpected } from "./helpers/line-shape";
import { fixturePageRows } from "./helpers/rows";

async function run(name: string): Promise<ExtractionResult> {
  const outcome = await extractDocument(fixtureBytes(name), { fileName: name, requestId: "req-fixture" });
  if (outcome.kind !== "result") throw new Error(`${name} was refused: ${outcome.refusal.code}`);
  return outcome.result;
}

const project = (r: Refusal | ExpectedRefusal) => ({
  code: r.code,
  scope: r.scope,
  page: r.page,
  lineId: r.lineId,
  field: r.field,
  candidateRaws: "candidates" in r ? r.candidates?.map((c) => c.raw) : "candidateRaws" in r ? r.candidateRaws : undefined,
});

const sorted = <T>(items: T[]) => items.map((i) => JSON.stringify(i)).sort();

const countBy = <T>(items: T[], key: (item: T) => string) =>
  Object.fromEntries([...Map.groupBy(items, key)].map(([k, v]) => [k, v.length]));

const withoutNoise = (result: ExtractionResult) =>
  JSON.stringify(result, (key, value) => (key === "bbox" || key === "requestId" ? undefined : value));

const NUMBER = /\d[\d,.]*\d|\d/g;
const PAGE_REFERENCE = /\bpage \d+\b/gi;

it("every PDF in fixtures/pdfs has expectations", () => {
  expect(readdirSync(FIXTURE_DIR).filter((f) => f.endsWith(".pdf")).sort()).toEqual([...EXPECTED_FIXTURES].sort());
});

describe.each(EXPECTED_FIXTURES)("%s", (name) => {
  const expected = expectedFor(name);

  it("has the expected status and counts", async () => {
    const result = await run(name);
    expect({ status: result.status, pageCount: result.pageCount, lineCount: result.lineItems.length }).toEqual({
      status: expected.status,
      pageCount: expected.pageCount,
      lineCount: expected.lineCount,
    });
  });

  it("raises exactly the expected refusals", async () => {
    const result = await run(name);
    expect(sorted(result.refusals.map(project))).toEqual(sorted(expected.refusals.map(project)));
  });

  it("reports the printed totals", async () => {
    expect((await run(name)).documentTotals.map((t) => t.raw)).toEqual(expected.documentTotals);
  });

  it.runIf(expected.lines)("extracts the expected line values as printed", async () => {
    expect((await run(name)).lineItems.map(asExpected)).toEqual(expected.lines);
  });

  it.runIf(expected.mustNotHaveFields)("never fills fields the document doesn't have", async () => {
    for (const line of (await run(name)).lineItems) {
      for (const field of expected.mustNotHaveFields!) expect(line).not.toHaveProperty(field);
    }
  });

  it.runIf(expected.linesBySection)("groups lines by section", async () => {
    expect(countBy((await run(name)).lineItems, (l) => l.section)).toEqual(expected.linesBySection);
  });

  it.runIf(expected.linesByPage && expected.pageStatus)("reports every page's line count and status", async () => {
    const pages = (await run(name)).pages;
    expect(Object.fromEntries(pages.map((p) => [String(p.page), p.lineCount]))).toEqual(expected.linesByPage);
    expect(Object.fromEntries(pages.map((p) => [String(p.page), p.status]))).toEqual(expected.pageStatus);
  });

  it("never outputs a forbidden (derived) number", async () => {
    const json = withoutNoise(await run(name));
    for (const forbidden of expected.forbiddenInOutput) expect(json).not.toContain(forbidden);
  });

  it("traces every evidenced value to a line of its page's text", async () => {
    const result = await run(name);
    const pageRows = await fixturePageRows(name);
    for (const { path, value } of allEvidenced(result)) {
      const lines = (pageRows.get(value.evidence.page) ?? []).map((row) => row.text);
      expect(value.evidence.sourceText, path).toContain(value.raw);
      expect(lines, path).toContain(value.evidence.sourceText);
    }
  });

  it("cites refusal text that is on the page it names", async () => {
    const result = await run(name);
    const pageRows = await fixturePageRows(name);
    for (const refusal of result.refusals.filter((r) => r.sourceText !== undefined)) {
      const lines = (pageRows.get(refusal.page ?? 0) ?? []).map((row) => row.text);
      expect(lines, refusal.id).toContain(refusal.sourceText);
      if (refusal.raw) expect(refusal.sourceText, refusal.id).toContain(refusal.raw);
    }
  });

  it("only shows the user numbers that are printed in the PDF", async () => {
    const result = await run(name);
    const pageRows = await fixturePageRows(name);
    const printed = new Set([...pageRows.values()].flat().flatMap((row) => row.text.match(NUMBER) ?? []));
    for (const refusal of result.refusals) {
      const userText = `${refusal.userMessage} ${refusal.suggestedAction ?? ""}`.replace(PAGE_REFERENCE, "");
      for (const token of userText.match(NUMBER) ?? []) expect(printed, `${refusal.id}: ${token}`).toContain(token);
    }
  });
});
