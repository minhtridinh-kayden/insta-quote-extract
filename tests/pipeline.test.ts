import { describe, expect, it } from "vitest";
import { extractDocument, processTextPage, type PageProcessor } from "@/lib/extraction/pipeline";
import { ExtractionResultSchema, type ExtractionResult } from "@/lib/schema";
import { fixtureBytes } from "./helpers/fixtures";

const input = { fileName: "test.pdf", requestId: "req-test" };

async function resultOf(name: string, processPage?: PageProcessor): Promise<ExtractionResult> {
  const outcome = await extractDocument(fixtureBytes(name), { ...input, processPage });
  if (outcome.kind !== "result") throw new Error(`expected a result, got ${outcome.refusal.code}`);
  return outcome.result;
}

describe("per-page containment", () => {
  const failPage2: PageProcessor = (page, runs) => {
    if (page === 2) throw new Error("simulated parser crash");
    return processTextPage(page, runs);
  };

  it("keeps every other page when one page throws", async () => {
    const result = await resultOf("KBS-DR118.pdf", failPage2);
    expect(result.pages.map((p) => `${p.page}:${p.status}`)).toEqual([
      "1:ok", "2:refused", "3:ok", "4:refused", "5:needs_review", "6:needs_review", "7:needs_review", "8:needs_review",
    ]);
    expect(result.lineItems.filter((l) => l.section === "delivery").map((l) => l.page)).toEqual([1, 1, 1, 3, 3, 3]);
    expect(result.refusals.find((r) => r.page === 2)).toMatchObject({ code: "PAGE_PARSE_FAILED", scope: "page" });
    expect(result.status).toBe("needs_review");
  });

  it("puts the crash reason in technicalDetail only", async () => {
    const refusal = (await resultOf("KBS-DR118.pdf", failPage2)).refusals.find((r) => r.page === 2)!;
    expect(refusal.technicalDetail).toContain("simulated parser crash");
    expect(refusal.userMessage).not.toContain("simulated");
  });
});

describe("document outcomes", () => {
  it("returns a refusal, not a result, for bytes that aren't a PDF", async () => {
    const outcome = await extractDocument(new TextEncoder().encode("hello"), input);
    expect(outcome).toMatchObject({ kind: "refused", refusal: { code: "NOT_A_PDF", scope: "document" } });
  });

  it("returns a result with nothing extracted for a fully scanned file", async () => {
    const result = await resultOf("KBS-10241.pdf");
    expect(result).toMatchObject({ status: "nothing_extracted", pageCount: 1, lineItems: [] });
    expect(result.pages).toEqual([{ page: 1, status: "refused", lineCount: 0 }]);
  });

  it.each(["KBS-10234.pdf", "KBS-10241.pdf", "KBS-10255.pdf", "KBS-10262.pdf", "KBS-10270.pdf", "KBS-DR118.pdf"])(
    "%s produces a result the client schema accepts",
    async (name) => {
      expect(ExtractionResultSchema.safeParse(await resultOf(name)).success).toBe(true);
    },
  );
});

describe("sections", () => {
  it("keeps non-delivery lines, tags them, and refuses each such page once", async () => {
    const result = await resultOf("KBS-DR118.pdf");
    const bySection = Map.groupBy(result.lineItems, (l) => l.section);
    expect([...bySection].map(([s, ls]) => [s, ls.length])).toEqual([
      ["delivery", 9], ["summary", 3], ["returns", 3], ["credit", 3], ["acceptance", 3],
    ]);
    expect(result.refusals.filter((r) => r.code === "NON_DELIVERY_SECTION").map((r) => r.page)).toEqual([5, 6, 7, 8]);
  });

  it("cites each page's subtitle as the evidence for its section", async () => {
    const page6 = (await resultOf("KBS-DR118.pdf")).pages.find((p) => p.page === 6)!;
    expect(page6.section).toMatchObject({ value: "returns", evidence: { page: 6 } });
  });
});

describe("linking and provenance", () => {
  it("contains a page whose section cites text that isn't on it", async () => {
    const forgedSection: PageProcessor = (page, runs) => {
      const extraction = processTextPage(page, runs);
      if (page !== 6 || !extraction.section || extraction.section.raw === null) return extraction;
      return { ...extraction, section: { ...extraction.section, raw: "Delivery Docket" } };
    };
    const result = await resultOf("KBS-DR118.pdf", forgedSection);
    expect(result.pages.find((p) => p.page === 6)).toMatchObject({ status: "refused", lineCount: 0 });
    expect(result.refusals.find((r) => r.page === 6)).toMatchObject({ code: "PAGE_PARSE_FAILED" });
    expect(result.lineItems.filter((l) => l.page === 5)).toHaveLength(3);
  });

  it("refuses a count mention it can't trace instead of dropping it silently", async () => {
    const forgedMention: PageProcessor = (page, runs) => {
      const extraction = processTextPage(page, runs);
      const [first, second] = extraction.mentions;
      return { ...extraction, mentions: [first, { ...second, count: { ...second.count, raw: "18 pallets", value: 18 } }] };
    };
    const result = await resultOf("KBS-10262.pdf", forgedMention);
    expect(result.refusals.map((r) => r.code)).toEqual(["VALUE_NOT_IN_SOURCE"]);
    expect(result.refusals[0].userMessage).toContain("count");
  });

  it("links every line-level refusal into its line", async () => {
    const result = await resultOf("KBS-10255.pdf");
    for (const refusal of result.refusals.filter((r) => r.lineId)) {
      expect(result.lineItems.find((l) => l.id === refusal.lineId)?.refusalIds).toContain(refusal.id);
    }
  });

  it("never fires the provenance guard on a real fixture", async () => {
    for (const name of ["KBS-10234.pdf", "KBS-10255.pdf", "KBS-10262.pdf", "KBS-10270.pdf", "KBS-DR118.pdf"]) {
      expect((await resultOf(name)).refusals.map((r) => r.code)).not.toContain("VALUE_NOT_IN_SOURCE");
    }
  });

  it("drops a value it can't trace back to the page and says so", async () => {
    const tampered: PageProcessor = (page, runs) => {
      const extraction = processTextPage(page, runs);
      const [first, ...rest] = extraction.lines;
      const forged = { ...first.lineTotal!, raw: "$1,538.20", value: 1538.2 };
      return { ...extraction, lines: [{ ...first, lineTotal: forged }, ...rest] };
    };
    const result = await resultOf("KBS-10234.pdf", tampered);
    expect(result.lineItems[0]).not.toHaveProperty("lineTotal");
    expect(result.refusals).toContainEqual(
      expect.objectContaining({ code: "VALUE_NOT_IN_SOURCE", lineId: "p1-l1", field: "lineTotal" }),
    );
    expect(result.lineItems[0].refusalIds.some((id) => id.startsWith("r-VALUE_NOT_IN_SOURCE"))).toBe(true);
    expect(JSON.stringify(result)).not.toContain("1,538.20");
  });

  it("drops a value whose evidence claims a different page", async () => {
    const wrongPage: PageProcessor = (page, runs) => {
      const extraction = processTextPage(page, runs);
      if (page !== 2) return extraction;
      const [first, ...rest] = extraction.lines;
      const quantity = { ...first.quantity!, evidence: { ...first.quantity!.evidence, page: 1 } };
      return { ...extraction, lines: [{ ...first, quantity }, ...rest] };
    };
    const result = await resultOf("KBS-DR118.pdf", wrongPage);
    expect(result.lineItems.find((l) => l.id === "p2-l1")).not.toHaveProperty("quantity");
    expect(result.refusals).toContainEqual(expect.objectContaining({ code: "VALUE_NOT_IN_SOURCE", page: 2, lineId: "p2-l1" }));
    expect(result.status).toBe("needs_review");
  });
});
