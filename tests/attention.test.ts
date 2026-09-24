import { describe, expect, it } from "vitest";
import { highlight, sortRefusals, whereLabel } from "@/lib/client";
import type { Refusal } from "@/lib/schema";
import { fixtureResult } from "./helpers/results";

const refusal = (over: Partial<Refusal>): Refusal => ({
  id: "r",
  code: "MISSING_VALUE",
  scope: "field",
  userMessage: "message",
  technicalDetail: "",
  ...over,
});

describe("sortRefusals", () => {
  it("orders document, then page, then line, then field, and by page within a scope", () => {
    const sorted = sortRefusals([
      refusal({ id: "field-p1", scope: "field", page: 1, lineId: "p1-l2" }),
      refusal({ id: "page-p4", scope: "page", page: 4 }),
      refusal({ id: "doc", scope: "document" }),
      refusal({ id: "page-p2", scope: "page", page: 2 }),
      refusal({ id: "field-p1-l10", scope: "field", page: 1, lineId: "p1-l10" }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["doc", "page-p2", "page-p4", "field-p1", "field-p1-l10"]);
  });

  it("lists DR118's scanned page before the non-delivery pages", async () => {
    const { refusals } = await fixtureResult("KBS-DR118.pdf");
    expect(sortRefusals(refusals).map((r) => r.page)).toEqual([4, 5, 6, 7, 8]);
  });
});

describe("whereLabel", () => {
  it.each([
    [refusal({ scope: "document" }), "Whole document"],
    [refusal({ scope: "document", page: 1 }), "Page 1 (affects the whole document)"],
    [refusal({ scope: "field", page: 3 }), "Page 3"],
  ])("labels %# in plain words", (r, label) => {
    expect(whereLabel(r)).toBe(label);
  });
});

describe("highlight", () => {
  it("splits the source row around the printed value", () => {
    expect(highlight("Driver notes: 16 pallets unloaded at site", "16 pallets")).toEqual({
      before: "Driver notes: ",
      match: "16 pallets",
      after: " unloaded at site",
    });
  });

  it("marks only a whole printed value, never part of another number", () => {
    const row = "1 Galv nails 90mm, bulk 4 25kg $68.00 /bag";
    expect(highlight(row, "4")).toEqual({ before: "1 Galv nails 90mm, bulk ", match: "4", after: " 25kg $68.00 /bag" });
    expect(highlight(row, "68")).toMatchObject({ match: "" });
  });

  it("marks nothing rather than guess when the value appears twice", () => {
    expect(highlight("1 Nails 1 box $5.00 $5.00", "1")).toMatchObject({ match: "" });
  });

  it("shows the whole row unhighlighted when the value isn't in it", () => {
    expect(highlight("Total: $5.00", "$9.00")).toEqual({ before: "Total: $5.00", match: "", after: "" });
  });
});
