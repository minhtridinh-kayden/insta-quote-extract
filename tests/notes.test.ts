import { describe, expect, it } from "vitest";
import { readNotes } from "@/lib/extraction/notes";
import type { TextRun } from "@/lib/extraction/pdf";
import { groupRows } from "@/lib/extraction/rows";
import { extractTable } from "@/lib/extraction/table";
import { fixturePageRows } from "./helpers/rows";

async function notesOf(name: string, page = 1) {
  const rows = (await fixturePageRows(name)).get(page)!;
  return readNotes(page, rows, extractTable(page, "packing_list", rows).tableRows);
}

const run = (str: string, y: number, x = 42.5): TextRun => ({ str, x, y, w: str.length * 4, h: 9 });

describe("printed totals", () => {
  it.each([
    ["KBS-10234.pdf", "$2,630.00", 2630],
    ["KBS-10262.pdf", "$5,122.40", 5122.4],
    ["KBS-10270.pdf", "$1,612.90", 1612.9],
  ])("%s prints %s", async (name, raw, value) => {
    const { totals } = await notesOf(name);
    expect(totals).toMatchObject([{ raw, value, evidence: { page: 1, sourceText: `Total: ${raw}` } }]);
  });

  it("accepts a total with a trailing remark and different case", () => {
    const rows = groupRows([run("TOTAL $2,630.00 incl GST", 500)]);
    expect(readNotes(1, rows, new Set()).totals).toMatchObject([{ raw: "$2,630.00", value: 2630 }]);
  });

  it("does not read a weight remark as a total", async () => {
    expect((await notesOf("KBS-10255.pdf")).totals).toEqual([]);
  });

  it("points the evidence at the run that holds the amount", async () => {
    const [total] = (await notesOf("KBS-10234.pdf")).totals;
    expect(total.evidence.bbox?.[0]).toBeCloseTo(501.7, 1);
  });
});

describe("count mentions", () => {
  it("finds both pallet counts in KBS-10262, above and below the table", async () => {
    const { mentions } = await notesOf("KBS-10262.pdf");
    expect(mentions.map((m) => [m.noun.singular, m.count.raw, m.count.value])).toEqual([
      ["pallet", "14 pallets", 14],
      ["pallet", "16 pallets", 16],
    ]);
    expect(mentions[0].count.evidence.sourceText).toMatch(/^Summary: 14 pallets loaded at depot/);
    expect(mentions[1].count.evidence.sourceText).toMatch(/^Driver notes: 16 pallets unloaded at site/);
  });

  it.each(["KBS-10234.pdf", "KBS-10255.pdf", "KBS-10270.pdf"])("finds none in %s", async (name) => {
    expect((await notesOf(name)).mentions).toEqual([]);
  });

  it("never counts table rows, where 'sheet' is a unit", async () => {
    const rows = (await fixturePageRows("KBS-10234.pdf")).get(1)!;
    expect(readNotes(1, rows, new Set()).mentions.map((m) => m.count.raw)).toContain("12 sheet");
    expect((await notesOf("KBS-10234.pdf")).mentions).toEqual([]);
  });

  it("groups singular and plural forms under one noun", () => {
    const rows = groupRows([run("Loaded 1 box and 3 boxes", 500), run("1,200 bags on site", 480)]);
    const mentions = readNotes(1, rows, new Set()).mentions;
    expect(mentions.map((m) => [m.noun.singular, m.count.value])).toEqual([["box", 1], ["box", 3], ["bag", 1200]]);
  });

  it("does not read part of a decimal or badly grouped number as a count", () => {
    const rows = groupRows([run("2.5 pallets and 1,20 bags", 500)]);
    expect(readNotes(1, rows, new Set()).mentions).toEqual([]);
  });

  it("points the evidence at the run holding the mention, not a look-alike", () => {
    const rows = groupRows([run("21 bags", 500, 42.5), run("1 bag", 500, 200)]);
    const [first, second] = readNotes(1, rows, new Set()).mentions;
    expect(first.count.evidence.bbox?.[0]).toBe(42.5);
    expect(second.count.evidence.bbox?.[0]).toBe(200);
  });

  it("reads no notes from a page whose table layout wasn't recognised", () => {
    const rows = groupRows([run("Kowhai Building Supplies Ltd", 785), run("1 Nails 12 sheet $5.00", 700)]);
    expect(readNotes(1, rows, extractTable(1, "unknown", rows).tableRows).mentions).toEqual([]);
  });

  it("ignores numbers not followed by a count noun", () => {
    const rows = groupRows([run("Plasterboard screws 32mm (box of 1000)", 500)]);
    expect(readNotes(1, rows, new Set()).mentions).toEqual([]);
  });
});

describe("cost note", () => {
  it("finds the freight remark in KBS-10270", async () => {
    expect((await notesOf("KBS-10270.pdf")).costNote).toBe("Freight and handling included where applicable.");
  });

  it("skips a 'Tax Invoice' heading and any remark that carries a number", () => {
    const rows = groupRows([run("Tax Invoice", 780), run("Freight: $45.00", 520), run("Freight included.", 500)]);
    expect(readNotes(1, rows, new Set()).costNote).toBe("Freight included.");
  });

  it("does not mistake a delivery docket remark for a cost", async () => {
    expect((await notesOf("KBS-10234.pdf")).costNote).toBeUndefined();
  });
});
