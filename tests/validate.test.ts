import { describe, expect, it } from "vitest";
import { readNotes } from "@/lib/extraction/notes";
import { extractTable } from "@/lib/extraction/table";
import { crossCheck } from "@/lib/extraction/validate";
import { RefusalSchema, type Evidenced, type LineItem } from "@/lib/schema";
import { fixturePageRows } from "./helpers/rows";

async function checkFixture(name: string) {
  const rows = (await fixturePageRows(name)).get(1)!;
  const table = extractTable(1, "packing_list", rows);
  const notes = readNotes(1, rows, table.tableRows);
  return crossCheck({ lines: table.lines, pageTotals: [{ page: 1, ...notes }], mentions: notes.mentions });
}

const sourceText = "1 Framing nails 10 box $6.40 $70.00";
const ev = <T>(raw: string, value: T): Evidenced<T> => ({ value, raw, evidence: { page: 1, sourceText }, source: "document" });

function line(quantity: string, unitPrice: string, lineTotal: string): LineItem {
  return {
    id: "p1-l1",
    page: 1,
    section: "packing_list",
    description: ev("Framing nails", "Framing nails"),
    quantity: ev(quantity, Number(quantity)),
    unitPrice: ev(unitPrice, Number(unitPrice.replace(/[$,]/g, ""))),
    lineTotal: ev(lineTotal, Number(lineTotal.replace(/[$,]/g, ""))),
    extra: {},
    refusalIds: [],
  };
}

describe("cross-checks on the fixtures", () => {
  it.each(["KBS-10234.pdf", "KBS-10255.pdf"])("%s reconciles with no refusal", async (name) => {
    expect(await checkFixture(name)).toEqual([]);
  });

  it("KBS-10270 refuses the total, citing only the printed figure", async () => {
    const refusals = await checkFixture("KBS-10270.pdf");
    expect(refusals).toMatchObject([
      { code: "TOTAL_MISMATCH", scope: "document", page: 1, raw: "$1,612.90", candidates: [{ raw: "$1,612.90" }] },
    ]);
    expect(refusals[0].userMessage).toContain("Freight and handling included where applicable");
    const json = JSON.stringify(refusals);
    for (const derived of ["1,538.20", "1538.2", "74.70", "74.7"]) expect(json).not.toContain(derived);
  });

  it("KBS-10262 surfaces both pallet counts and picks neither", async () => {
    const refusals = await checkFixture("KBS-10262.pdf");
    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toMatchObject({ code: "CONFLICTING_VALUES", scope: "document" });
    expect(refusals[0].candidates?.map((c) => [c.raw, c.evidence.sourceText.slice(0, 13)])).toEqual([
      ["14 pallets", "Summary: 14 p"],
      ["16 pallets", "Driver notes:"],
    ]);
    expect(refusals[0]).not.toHaveProperty("value");
  });

  it("produces refusals that satisfy the shared schema", async () => {
    for (const name of ["KBS-10262.pdf", "KBS-10270.pdf"]) {
      for (const refusal of await checkFixture(name)) expect(RefusalSchema.safeParse(refusal).success).toBe(true);
    }
  });
});

describe("line arithmetic", () => {
  it("flags a line whose printed total doesn't match and keeps all three printed values", () => {
    const refusals = crossCheck({ lines: [line("10", "$6.40", "$70.00")], pageTotals: [], mentions: [] });
    expect(refusals).toMatchObject([
      { code: "LINE_ARITHMETIC_MISMATCH", scope: "line", lineId: "p1-l1", candidates: [{ raw: "10" }, { raw: "$6.40" }, { raw: "$70.00" }] },
    ]);
    expect(refusals[0].userMessage).not.toContain("64");
  });

  it.each([
    ["10", "$6.40", "$64.00"],
    ["2.5", "$4.00", "$10.00"],
    ["1,200", "$0.09", "$108.00"],
    ["3", "$0.10", "$0.30"],
  ])("accepts %s × %s = %s exactly", (q, p, t) => {
    expect(crossCheck({ lines: [line(q, p, t)], pageTotals: [], mentions: [] })).toEqual([]);
  });

  it("checks a price that carries a basis against its printed total", () => {
    expect(crossCheck({ lines: [line("4", "$68.00 /bag", "$272.00")], pageTotals: [], mentions: [] })).toEqual([]);
  });
});

describe("conflicting counts", () => {
  const mention = (text: string, raw: string, value: number, page = 1) => ({
    noun: { singular: "bag", plural: "bags" } as const,
    count: { value, raw, evidence: { page, sourceText: text }, source: "document" as const },
  });

  it("does not treat different counts in one note as a contradiction", () => {
    const note = "3 bags cement, 5 bags sand";
    expect(crossCheck({ lines: [], pageTotals: [], mentions: [mention(note, "3 bags", 3), mention(note, "5 bags", 5)] })).toEqual([]);
  });

  it("flags the same noun with different counts in different notes", () => {
    const refusals = crossCheck({
      lines: [],
      pageTotals: [],
      mentions: [mention("Loaded: 3 bags", "3 bags", 3), mention("Unloaded: 5 bags", "5 bags", 5, 2)],
    });
    expect(refusals).toMatchObject([{ code: "CONFLICTING_VALUES", candidates: [{ raw: "3 bags" }, { raw: "5 bags" }] }]);
  });
});

describe("totals", () => {
  it("skips the check when a line on the page has no printed total", () => {
    const withoutTotal = { ...line("1", "$5.00", "$5.00"), lineTotal: undefined };
    const total = ev("$9.00", 9);
    expect(crossCheck({ lines: [withoutTotal], pageTotals: [{ page: 1, totals: [total] }], mentions: [] })).toEqual([]);
  });

  it("never adds up lines from other pages", () => {
    const page2 = { ...line("1", "$5.00", "$5.00"), id: "p2-l1", page: 2 };
    const total = ev("$64.00", 64);
    const refusals = crossCheck({ lines: [line("10", "$6.40", "$64.00"), page2], pageTotals: [{ page: 1, totals: [total] }], mentions: [] });
    expect(refusals).toEqual([]);
  });
});
