import { describe, expect, it } from "vitest";
import { readPdf, type TextRun } from "@/lib/extraction/pdf";
import { groupRows, toPageText } from "@/lib/extraction/rows";
import { fixtureBytes } from "./helpers/fixtures";

const run = (str: string, x: number, y: number): TextRun => ({ str, x, y, w: 10, h: 9 });

async function fixtureRows(name: string, page = 1) {
  const result = await readPdf(fixtureBytes(name));
  const read = result.ok ? result.pages[page - 1] : undefined;
  if (read?.kind !== "text") throw new Error(`${name} p${page} has no text`);
  return groupRows(read.runs);
}

describe("groupRows", () => {
  it("groups runs within 2pt of each other into one row", () => {
    const rows = groupRows([run("b", 100, 700.9), run("a", 40, 700), run("c", 40, 697.9)]);
    expect(rows.map((r) => r.text)).toEqual(["a b", "c"]);
  });

  it("orders rows top to bottom and runs left to right", () => {
    const rows = groupRows([run("low", 40, 100), run("right", 300, 500), run("left", 40, 500)]);
    expect(rows.map((r) => r.text)).toEqual(["left right", "low"]);
    expect(rows.map((r) => r.index)).toEqual([0, 1]);
  });

  it("returns no rows for no runs", () => {
    expect(groupRows([])).toEqual([]);
  });
});

describe("KBS-10234 rows", () => {
  it("match the layout documented in FIXTURES.md", async () => {
    const texts = (await fixtureRows("KBS-10234.pdf")).map((r) => r.text);
    expect(texts[0]).toBe("Kowhai Building Supplies Ltd");
    expect(texts[1]).toBe("Packing List");
    expect(texts).toContain("Item Description Qty Unit Unit Price Line Total");
    expect(texts).toContain("1 10mm GIB Standard board 2400x1200 48 sheet $24.90 $1,195.20");
    expect(texts).toContain("5 Plasterboard screws 32mm (box of 1000) 8 box $42.00 $336.00");
    expect(texts).toContain("Total: $2,630.00");
  });

  it("keep one run per table cell", async () => {
    const line = (await fixtureRows("KBS-10234.pdf")).find((r) => r.text.startsWith("1 10mm"));
    expect(line?.runs.map((r) => r.str)).toEqual([
      "1", "10mm GIB Standard board 2400x1200", "48", "sheet", "$24.90", "$1,195.20",
    ]);
  });
});

describe("provenance", () => {
  it.each(["KBS-10234.pdf", "KBS-10255.pdf", "KBS-10262.pdf", "KBS-10270.pdf"])(
    "%s: every run is inside its row, and every row is a line of the page text",
    async (name) => {
      const rows = await fixtureRows(name);
      const lines = toPageText(rows).split("\n");
      for (const row of rows) {
        expect(lines).toContain(row.text);
        for (const r of row.runs) expect(row.text).toContain(r.str);
      }
    },
  );
});
