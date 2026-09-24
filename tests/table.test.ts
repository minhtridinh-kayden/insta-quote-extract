import { describe, expect, it } from "vitest";
import type { TextRun } from "@/lib/extraction/pdf";
import { groupRows } from "@/lib/extraction/rows";
import { extractTable, findTableLayout } from "@/lib/extraction/table";
import { LineItemSchema, RefusalSchema, type LineItem } from "@/lib/schema";
import { expectedFor } from "./helpers/expected";
import { fixturePageRows } from "./helpers/rows";

const run = (str: string, x: number, y: number): TextRun => ({ str, x, y, w: str.length * 4, h: 9 });

const HEADER = [["Item", 42.5], ["Description", 70.9], ["Qty", 326], ["Unit", 377], ["Unit Price", 428], ["Line Total", 501.7]] as const;

function syntheticRows(...cells: (string | null)[][]) {
  const runs = HEADER.map(([str, x]) => run(str, x, 700));
  cells.forEach((row, i) =>
    row.forEach((str, col) => {
      if (str !== null) runs.push(run(str, HEADER[col][1], 680 - i * 17));
    }),
  );
  return groupRows(runs);
}

function asExpected(line: LineItem) {
  return {
    id: line.id,
    section: line.section,
    description: line.description?.raw,
    ...(line.quantity && { quantity: line.quantity.raw }),
    ...(line.unit && { unit: line.unit.raw }),
    ...(line.unitPrice && { unitPrice: line.unitPrice.raw }),
    ...(line.priceBasis && { priceBasis: line.priceBasis.value }),
    ...(line.lineTotal && { lineTotal: line.lineTotal.raw }),
    ...(Object.keys(line.extra).length > 0 && {
      extra: Object.fromEntries(Object.entries(line.extra).map(([k, v]) => [k, v.raw])),
    }),
  };
}

const refusalKeys = (refusals: { code: string; scope: string; page?: number; lineId?: string; field?: string }[]) =>
  refusals.map(({ code, scope, page, lineId, field }) => ({ code, scope, page, lineId, field })).sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  );

describe("table layout", () => {
  it("derives columns from the header text, not fixed positions", async () => {
    const rows = (await fixturePageRows("KBS-10255.pdf")).get(1)!;
    const layout = findTableLayout(rows)!;
    expect(layout.columns.map((c) => [c.heading, c.field])).toEqual([
      ["Item", "itemNo"], ["Description", "description"], ["Qty", "quantity"],
      ["Weight", "extra.Weight"], ["Unit Price", "unitPrice"],
    ]);
    expect(layout.columns.find((c) => c.field === "quantity")?.start).toBeCloseTo(307.8, 1);
  });

  it("fails closed when no header is found", () => {
    const rows = groupRows([run("Kowhai Building Supplies Ltd", 42.5, 785), run("Some letter", 42.5, 765)]);
    const { lines, refusals } = extractTable(1, "unknown", rows);
    expect(lines).toEqual([]);
    expect(refusals.map((r) => [r.code, r.scope, r.page])).toEqual([["UNRECOGNISED_LAYOUT", "page", 1]]);
  });
});

describe.each(["KBS-10234.pdf", "KBS-10255.pdf"])("%s table", (name) => {
  const expected = expectedFor(name);

  it("extracts the expected lines with their printed values", async () => {
    const rows = (await fixturePageRows(name)).get(1)!;
    const { lines } = extractTable(1, "packing_list", rows);
    expect(lines.map(asExpected)).toEqual(expected.lines);
  });

  it("raises exactly the expected refusals", async () => {
    const rows = (await fixturePageRows(name)).get(1)!;
    const { refusals } = extractTable(1, "packing_list", rows);
    expect(refusalKeys(refusals)).toEqual(refusalKeys(expected.refusals.map((r) => ({ ...r }))));
  });

  it("produces values that satisfy the shared schema", async () => {
    const rows = (await fixturePageRows(name)).get(1)!;
    const { lines, refusals } = extractTable(1, "packing_list", rows);
    for (const line of lines) expect(LineItemSchema.safeParse(line).success).toBe(true);
    for (const refusal of refusals) expect(RefusalSchema.safeParse(refusal).success).toBe(true);
  });
});

describe("KBS-10255 does not infer what isn't printed", () => {
  it("has no unit or line total, and never takes the unit from the price basis", async () => {
    const rows = (await fixturePageRows("KBS-10255.pdf")).get(1)!;
    const { lines } = extractTable(1, "packing_list", rows);
    for (const line of lines) {
      expect(line).not.toHaveProperty("unit");
      expect(line).not.toHaveProperty("lineTotal");
    }
  });

  it("links each weight refusal to its line", async () => {
    const rows = (await fixturePageRows("KBS-10255.pdf")).get(1)!;
    const { lines, refusals } = extractTable(1, "packing_list", rows);
    const weightRefusal = refusals.find((r) => r.lineId === "p1-l1")!;
    expect(weightRefusal.id).toBe("r-AMBIGUOUS_UNIT_BASIS-p1-l1-extra.Weight");
    expect(lines[0].refusalIds).toEqual([weightRefusal.id]);
    expect(lines[1].refusalIds).toEqual([]);
  });
});

describe("tables that can't be read safely fail closed", () => {
  it("refuses a header with no numbered items under it", () => {
    const rows = syntheticRows(["Total:", null, null, null, null, "$5.00"]);
    expect(extractTable(1, "packing_list", rows)).toMatchObject({
      lines: [],
      refusals: [{ code: "UNRECOGNISED_LAYOUT", scope: "page", page: 1 }],
    });
  });

  it("refuses a header that names the same column twice", () => {
    const runs = [...HEADER.map(([str, x]) => run(str, x, 700)), run("Qty", 560, 700)];
    runs.push(run("1", 42.5, 680), run("Nails", 70.9, 680), run("10", 326, 680), run("12", 560, 680));
    const { lines, refusals } = extractTable(1, "packing_list", groupRows(runs));
    expect(lines).toEqual([]);
    expect(refusals.map((r) => r.code)).toEqual(["UNRECOGNISED_LAYOUT"]);
  });

  it("skips a dashed rule printed as several runs", () => {
    const rows = syntheticRows(["----", "--------", "---", "----", "------", "------"], ["1", "Nails", "1", "box", "$5.00", "$5.00"]);
    expect(extractTable(1, "packing_list", rows).lines).toHaveLength(1);
  });
});

describe("KBS-DR118 tables", () => {
  it("reads three lines per readable page with page-scoped ids", async () => {
    const pages = await fixturePageRows("KBS-DR118.pdf");
    for (const [page, rows] of pages) {
      const { lines, refusals } = extractTable(page, "delivery", rows);
      expect(lines.map((l) => l.id)).toEqual([`p${page}-l1`, `p${page}-l2`, `p${page}-l3`]);
      expect(refusals).toEqual([]);
    }
  });
});

describe("cell-level refusals keep the rest of the line", () => {
  it("refuses a blank line total but keeps quantity and price", () => {
    const rows = syntheticRows(["1", "Framing nails", "10", "box", "$9.00", null]);
    const { lines, refusals } = extractTable(1, "packing_list", rows);
    expect(lines[0]).toMatchObject({ quantity: { raw: "10" }, unitPrice: { raw: "$9.00" } });
    expect(lines[0]).not.toHaveProperty("lineTotal");
    expect(refusals).toMatchObject([{ code: "MISSING_VALUE", scope: "field", lineId: "p1-l1", field: "lineTotal" }]);
  });

  it("refuses an ambiguous quantity without guessing", () => {
    const rows = syntheticRows(["1", "Screws", "1.250", "ea", "$0.10", "$125.00"]);
    const { lines, refusals } = extractTable(1, "packing_list", rows);
    expect(lines[0]).not.toHaveProperty("quantity");
    expect(refusals).toMatchObject([{ code: "AMBIGUOUS_NUMBER_FORMAT", field: "quantity", raw: "1.250" }]);
  });

  it("joins a cell printed as two runs and keeps it inside the source row", () => {
    const rows = syntheticRows(["1", "Framing", "5", "ea", "$1.00", "$5.00"]);
    const [line] = extractTable(1, "packing_list", [
      rows[0],
      groupRows([...rows[1].runs, run("timber", 110, rows[1].y)])[0],
    ]).lines;
    expect(line.description?.raw).toBe("Framing timber");
    expect(line.description?.evidence.sourceText).toContain("Framing timber");
  });

  it("keeps a line whose description is missing, with its other printed values", () => {
    const rows = syntheticRows(["3", "TBC", "10", "box", "$9.00", "$90.00"]);
    const { lines, refusals } = extractTable(1, "packing_list", rows);
    expect(lines[0]).toMatchObject({ id: "p1-l1", quantity: { raw: "10" }, lineTotal: { raw: "$90.00" } });
    expect(lines[0]).not.toHaveProperty("description");
    expect(refusals).toMatchObject([{ code: "MISSING_VALUE", field: "description", lineId: "p1-l1" }]);
    expect(LineItemSchema.safeParse(lines[0]).success).toBe(true);
  });

  it("refuses a missing-value token in an extra column instead of showing it as a value", () => {
    const runs = [["Item", 42.5], ["Description", 70.9], ["Qty", 311.8], ["Weight", 377], ["Unit Price", 467.7]]
      .map(([str, x]) => run(str as string, x as number, 700));
    runs.push(run("1", 42.5, 680), run("Nails", 70.9, 680), run("4", 311.8, 680), run("TBC", 377, 680), run("$1.00", 467.7, 680));
    const { lines, refusals } = extractTable(1, "packing_list", groupRows(runs));
    expect(lines[0].extra).toEqual({});
    expect(refusals.find((r) => r.field === "extra.Weight")).toMatchObject({ code: "MISSING_VALUE", raw: "TBC" });
  });

  it("refuses a blank extra cell like any other blank cell", () => {
    const runs = [["Item", 42.5], ["Description", 70.9], ["Qty", 311.8], ["Weight", 377], ["Unit Price", 467.7]]
      .map(([str, x]) => run(str as string, x as number, 700));
    runs.push(run("1", 42.5, 680), run("Nails", 70.9, 680), run("4", 311.8, 680), run("$1.00", 467.7, 680));
    const { refusals } = extractTable(1, "packing_list", groupRows(runs));
    expect(refusals.find((r) => r.field === "extra.Weight")).toMatchObject({ code: "MISSING_VALUE" });
  });

  it("reads an item number printed left of the Item heading", () => {
    const rows = syntheticRows();
    const shifted = groupRows([...rows[0].runs, run("10", 36, 680), run("Nails", 70.9, 680), run("1", 326, 680)]);
    expect(extractTable(1, "packing_list", shifted).lines.map((l) => l.itemNo?.raw)).toEqual(["10"]);
  });

  it("ends the table at the first row that isn't an item", () => {
    const rows = syntheticRows(["1", "Nails", "1", "box", "$5.00", "$5.00"], ["Total:", null, null, null, null, "$5.00"]);
    expect(extractTable(1, "packing_list", rows).lines).toHaveLength(1);
  });
});
