import { describe, expect, it } from "vitest";
import { pageChip, pageViews } from "@/lib/client";
import { fixtureResult } from "./helpers/results";

describe("pageChip", () => {
  it("labels every DR118 page with its section and status in words", async () => {
    const result = await fixtureResult("KBS-DR118.pdf");
    expect(result.pages.map((p) => pageChip(p, result.refusals).label)).toEqual([
      "p1 · Delivery · OK",
      "p2 · Delivery · OK",
      "p3 · Delivery · OK",
      "p4 · Scanned, not read",
      "p5 · Summary · Check",
      "p6 · Returns note · Check",
      "p7 · Credit adjustment · Check",
      "p8 · Signed acceptance · Check",
    ]);
  });
});

describe("pageViews", () => {
  it("lists every page in order, including the one that wasn't read", async () => {
    const views = pageViews(await fixtureResult("KBS-DR118.pdf"));
    expect(views.map((v) => [v.page, v.sectionLabel ?? "-", v.lines.length])).toEqual([
      [1, "Delivery", 3], [2, "Delivery", 3], [3, "Delivery", 3], [4, "-", 0],
      [5, "Summary", 3], [6, "Returns note", 3], [7, "Credit adjustment", 3], [8, "Signed acceptance", 3],
    ]);
  });

  it("puts page-level notes on their page and line notes on their line", async () => {
    const views = pageViews(await fixtureResult("KBS-10255.pdf"));
    expect(views[0].pageNotes.map((r) => r.code)).toEqual(["COLUMN_NOT_PRESENT", "COLUMN_NOT_PRESENT"]);
    expect(views[0].lineNotes.get("p1-l1")?.map((r) => r.field)).toEqual(["extra.Weight"]);
    expect(views[0].lineNotes.get("p1-l2")).toEqual([]);
    expect(views[0].extraHeadings).toEqual(["Weight"]);
  });

  it("places a document-wide conflict on the pages its candidates come from", async () => {
    const [view] = pageViews(await fixtureResult("KBS-10262.pdf"));
    expect(view.pageNotes.map((r) => r.code)).toEqual(["CONFLICTING_VALUES"]);
  });
});
