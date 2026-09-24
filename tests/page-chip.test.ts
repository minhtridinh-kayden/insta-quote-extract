import { describe, expect, it } from "vitest";
import { groupLinesByPage, pageChip } from "@/lib/client";
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

describe("groupLinesByPage", () => {
  it("groups DR118 lines by page, skipping the unread page", async () => {
    const groups = groupLinesByPage(await fixtureResult("KBS-DR118.pdf"));
    expect(groups.map((g) => [g.page, g.section, g.lines.length])).toEqual([
      [1, "delivery", 3], [2, "delivery", 3], [3, "delivery", 3],
      [5, "summary", 3], [6, "returns", 3], [7, "credit", 3], [8, "acceptance", 3],
    ]);
  });

  it("collects extra columns such as Weight", async () => {
    const [group] = groupLinesByPage(await fixtureResult("KBS-10255.pdf"));
    expect(group.extraHeadings).toEqual(["Weight"]);
  });
});
