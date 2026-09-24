import { describe, expect, it } from "vitest";
import { classifySubtitle, pageSection } from "@/lib/extraction/section";
import { PageSummarySchema } from "@/lib/schema";
import { fixturePageRows } from "./helpers/rows";

describe("classifySubtitle", () => {
  it.each([
    ["Multi-Site Delivery Run 118 - Site 1 of 4 - Ranfurly Ave", "delivery"],
    ["Multi-Site Delivery Run 118 - Summary - Batch Delivery Run 118", "summary"],
    ["Returns Note", "returns"],
    ["Credit Adjustment", "credit"],
    ["Signed Acceptance", "acceptance"],
    ["Packing List", "packing_list"],
    ["Tax Invoice", "unknown"],
  ])("%s → %s", (subtitle, section) => {
    expect(classifySubtitle(subtitle)).toBe(section);
  });
});

describe("pageSection on fixtures", () => {
  it("classifies every readable DR118 page by its own subtitle", async () => {
    const pages = await fixturePageRows("KBS-DR118.pdf");
    const sections = [...pages].map(([page, rows]) => [page, pageSection(page, rows).value]);
    expect(sections).toEqual([
      [1, "delivery"], [2, "delivery"], [3, "delivery"],
      [5, "summary"], [6, "returns"], [7, "credit"], [8, "acceptance"],
    ]);
  });

  it("reads KBS-10262 as a packing list despite its 'Summary:' note", async () => {
    const rows = (await fixturePageRows("KBS-10262.pdf")).get(1)!;
    expect(pageSection(1, rows).value).toBe("packing_list");
  });

  it("cites the subtitle row as evidence", async () => {
    const rows = (await fixturePageRows("KBS-DR118.pdf")).get(6)!;
    const section = pageSection(6, rows);
    expect(section).toMatchObject({ value: "returns", evidence: { page: 6, sourceText: rows[1].text } });
    expect(PageSummarySchema.shape.section.safeParse(section).success).toBe(true);
  });

  it("returns unknown without evidence when there is no subtitle row", () => {
    expect(pageSection(1, [])).toEqual({ value: "unknown", raw: null });
  });
});
