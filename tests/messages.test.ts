import { describe, expect, it } from "vitest";
import { describeRefusal, type MessageInputs } from "@/lib/extraction/messages";
import { RefusalCodeSchema, type RefusalCode } from "@/lib/schema";

const samples: { [C in RefusalCode]: MessageInputs[C] } = {
  NOT_A_PDF: { fileName: "notes.pdf" },
  ENCRYPTED: {},
  EMPTY_DOCUMENT: {},
  FILE_TOO_LARGE: { maxMb: 4 },
  NO_TEXT_LAYER: { page: 4 },
  PAGE_PARSE_FAILED: { page: 2 },
  UNRECOGNISED_LAYOUT: { page: 3 },
  NON_DELIVERY_SECTION: { page: 6, section: "returns" },
  COLUMN_NOT_PRESENT: { page: 1, field: "lineTotal" },
  MISSING_VALUE: { page: 1, description: "Stud adhesive 400ml cartridge", field: "unitPrice", raw: "TBC" },
  AMBIGUOUS_NUMBER_FORMAT: { page: 1, description: "Galv nails 90mm, bulk", field: "quantity", raw: "1.250" },
  AMBIGUOUS_UNIT_BASIS: { page: 1, description: "Galv nails 90mm, bulk", field: "extra.Weight", raw: "25kg" },
  LINE_ARITHMETIC_MISMATCH: {
    page: 1,
    description: "Corner trim, 3m length",
    quantityRaw: "10",
    unitPriceRaw: "$6.40",
    lineTotalRaw: "$70.00",
  },
  TOTAL_MISMATCH: { page: 1, totalRaw: "$1,612.90", note: "Freight and handling included where applicable." },
  CONFLICTING_VALUES: { countNoun: "pallets", raws: ["14 pallets", "16 pallets"] },
  VALUE_NOT_IN_SOURCE: { page: 1, field: "lineTotal" },
};

const numberTokens = (text: string) => text.match(/\d[\d,.]*\d|\d/g) ?? [];

describe.each(RefusalCodeSchema.options)("%s message", (code) => {
  const input = samples[code];
  const copy = describeRefusal(code, input as never);
  const text = `${copy.userMessage} ${copy.suggestedAction}`;

  it("has a message and a next step", () => {
    expect(copy.userMessage.length).toBeGreaterThan(20);
    expect(copy.suggestedAction.length).toBeGreaterThan(10);
  });

  it("uses plain language without codes or error wording", () => {
    expect(text).not.toMatch(/\b[A-Z]+(?:_[A-Z]+)+\b/);
    expect(text).not.toMatch(/error|invalid|something went wrong/i);
  });

  it("only contains numbers taken from its input", () => {
    const allowed = JSON.stringify(input);
    for (const token of numberTokens(text)) expect(allowed).toContain(token);
  });

  it("names the page when the refusal has one", () => {
    if ("page" in input) expect(copy.userMessage.toLowerCase()).toContain(`page ${input.page}`);
  });
});

describe("cross-check wording", () => {
  it("TOTAL_MISMATCH cites the printed total and never a computed sum or gap", () => {
    const { userMessage } = describeRefusal("TOTAL_MISMATCH", samples.TOTAL_MISMATCH);
    expect(userMessage).toContain("$1,612.90");
    for (const derived of ["1,538.20", "1538.2", "74.70", "74.7"]) {
      expect(userMessage).not.toContain(derived);
    }
  });

  it("CONFLICTING_VALUES lists every candidate without choosing", () => {
    const { userMessage } = describeRefusal("CONFLICTING_VALUES", samples.CONFLICTING_VALUES);
    expect(userMessage).toContain('"14 pallets" and "16 pallets"');
    expect(userMessage).toContain("haven't picked");
  });

  it("TOTAL_MISMATCH reads naturally without a note", () => {
    const { userMessage } = describeRefusal("TOTAL_MISMATCH", { page: 1, totalRaw: "$5.00" });
    expect(userMessage).not.toContain("undefined");
  });
});

describe("field labels", () => {
  it("names extra columns by their printed heading", () => {
    const { userMessage } = describeRefusal("AMBIGUOUS_UNIT_BASIS", samples.AMBIGUOUS_UNIT_BASIS);
    expect(userMessage).toContain("The weight for");
  });

  it("names a missing column by its printed heading", () => {
    const { userMessage } = describeRefusal("COLUMN_NOT_PRESENT", { page: 1, field: "unit" });
    expect(userMessage).toContain("no Unit column");
  });
});
