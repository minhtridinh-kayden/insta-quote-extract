import { describe, expect, it } from "vitest";
import { z } from "zod";
import { evidenced, ExtractionResultSchema, LineItemSchema, RefusalSchema } from "@/lib/schema";

const evidence = { page: 1, sourceText: "1 10mm GIB Standard board 2400x1200 48 sheet $24.90 $1,195.20" };
const price = { value: 24.9, raw: "$24.90", evidence, source: "document" as const };

describe("evidenced values", () => {
  const EvidencedNumber = evidenced(z.number());

  it("accepts a raw that appears in its source text", () => {
    expect(EvidencedNumber.safeParse(price).success).toBe(true);
  });

  it("rejects a raw that is not in its source text", () => {
    const result = EvidencedNumber.safeParse({ ...price, raw: "$1,538.20", value: 1538.2 });
    expect(result.success).toBe(false);
  });

  it("rejects values not sourced from the document", () => {
    expect(EvidencedNumber.safeParse({ ...price, source: "user" }).success).toBe(false);
  });
});

describe("line items", () => {
  const line = {
    id: "p1-l1",
    page: 1,
    section: "packing_list",
    description: { value: "10mm GIB Standard board 2400x1200", raw: "10mm GIB Standard board 2400x1200", evidence, source: "document" },
    unitPrice: price,
    extra: {},
    refusalIds: [],
  };

  it("accepts a line with only the fields the document printed", () => {
    expect(LineItemSchema.safeParse(line).success).toBe(true);
  });

  it("requires page-scoped ids", () => {
    expect(LineItemSchema.safeParse({ ...line, id: "1" }).success).toBe(false);
  });
});

describe("refusals and results", () => {
  const refusal = {
    id: "r-NO_TEXT_LAYER-p1",
    code: "NO_TEXT_LAYER",
    scope: "page",
    page: 1,
    userMessage: "Page 1 is a scanned image, so we couldn't read any text on it.",
    suggestedAction: "Upload the original digital PDF.",
    technicalDetail: "page 1: 0 text runs",
  };

  it("rejects unknown refusal codes", () => {
    expect(RefusalSchema.safeParse({ ...refusal, code: "OOPS" }).success).toBe(false);
  });

  it("accepts a fully refused document as a valid result", () => {
    const result = {
      requestId: "req-1",
      fileName: "KBS-10241.pdf",
      pageCount: 1,
      status: "nothing_extracted",
      pages: [{ page: 1, status: "refused", lineCount: 0 }],
      lineItems: [],
      documentTotals: [],
      refusals: [refusal],
    };
    expect(ExtractionResultSchema.safeParse(result).success).toBe(true);
  });
});
