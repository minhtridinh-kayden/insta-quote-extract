import { describe, expect, it } from "vitest";
import { readDocument, readPdf, type PdfDocumentLike } from "@/lib/extraction/pdf";
import { classifyLoadError } from "@/lib/extraction/pdf/load";
import { hasPdfSignature } from "@/lib/extraction/pdf/signature";
import { toTextRuns } from "@/lib/extraction/pdf/text-runs";
import { fixtureBytes } from "./helpers/fixtures";

const kinds = (result: Awaited<ReturnType<typeof readPdf>>) =>
  result.ok ? result.pages.map((p) => `${p.page}:${p.kind}`) : [];

describe("document-level refusals", () => {
  it("refuses bytes without the %PDF- signature, whatever the file is called", async () => {
    const result = await readPdf(new TextEncoder().encode("Invoice total $100.00"));
    expect(result).toMatchObject({ ok: false, failure: { code: "NOT_A_PDF" } });
  });

  it("refuses a file that starts like a PDF but has no readable structure", async () => {
    const result = await readPdf(new TextEncoder().encode("%PDF-1.4\nnot really a pdf"));
    expect(result).toMatchObject({ ok: false, failure: { code: "NOT_A_PDF" } });
  });

  it("refuses a document with no pages", async () => {
    const empty: PdfDocumentLike = { numPages: 0, getPage: () => Promise.reject(new Error("unreachable")) };
    expect(await readDocument(empty)).toMatchObject({ ok: false, failure: { code: "EMPTY_DOCUMENT" } });
  });

  it("classifies password-protected files as encrypted", () => {
    const error = Object.assign(new Error("No password given"), { name: "PasswordException" });
    expect(classifyLoadError(error)?.code).toBe("ENCRYPTED");
  });

  it("does not disguise unexpected failures as refusals", () => {
    expect(classifyLoadError(new Error("out of memory"))).toBeNull();
  });

  it("checks the signature on the first bytes only", () => {
    expect(hasPdfSignature(fixtureBytes("KBS-10234.pdf"))).toBe(true);
    expect(hasPdfSignature(new TextEncoder().encode(" %PDF-"))).toBe(false);
  });
});

describe("page-level reading", () => {
  it("reads every text page of a clean file", async () => {
    expect(kinds(await readPdf(fixtureBytes("KBS-10234.pdf")))).toEqual(["1:text"]);
  });

  it("marks a fully scanned file as having no text layer", async () => {
    expect(kinds(await readPdf(fixtureBytes("KBS-10241.pdf")))).toEqual(["1:no_text"]);
  });

  it("isolates the scanned page in a multi-page run", async () => {
    expect(kinds(await readPdf(fixtureBytes("KBS-DR118.pdf")))).toEqual([
      "1:text", "2:text", "3:text", "4:no_text", "5:text", "6:text", "7:text", "8:text",
    ]);
  });

  it("leaves the caller's bytes intact", async () => {
    const bytes = fixtureBytes("KBS-10234.pdf");
    const length = bytes.byteLength;
    await readPdf(bytes);
    expect(bytes.byteLength).toBe(length);
  });

  it("keeps reading the other pages when one page throws", async () => {
    const page = (items: unknown[]) => ({ getTextContent: async () => ({ items }) });
    const doc: PdfDocumentLike = {
      numPages: 3,
      getPage: async (n) => {
        if (n === 2) throw new Error("broken content stream");
        return page([{ str: `page ${n}`, transform: [9, 0, 0, 9, 40, 700], width: 30, height: 9 }]);
      },
    };
    const result = await readDocument(doc);
    expect(kinds(result)).toEqual(["1:text", "2:failed", "3:text"]);
    expect(result.ok && result.pages[1]).toMatchObject({ detail: "broken content stream" });
  });
});

describe("text runs", () => {
  it("keeps position and size, and drops whitespace-only and marked-content items", () => {
    const runs = toTextRuns([
      { str: "Qty", transform: [9, 0, 0, 9, 326, 666.1], width: 15, height: 9 },
      { str: " ", transform: [9, 0, 0, 9, 341, 666.1], width: 36, height: 0 },
      { str: "", transform: [9, 0, 0, 9, 42.5, 666.1], width: 0, height: 0 },
      { type: "beginMarkedContent" },
    ]);
    expect(runs).toEqual([{ str: "Qty", x: 326, y: 666.1, w: 15, h: 9 }]);
  });
});
