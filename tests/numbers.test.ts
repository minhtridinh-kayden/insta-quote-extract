import { describe, expect, it } from "vitest";
import {
  isMissingToken,
  measurementBasis,
  parseMoney,
  parsePrice,
  parseQuantity,
} from "@/lib/extraction/numbers";

describe("parseMoney", () => {
  it.each([
    ["$24.90", 24.9, 2490],
    ["$1,195.20", 1195.2, 119520],
    ["$0.09", 0.09, 9],
    ["$1,234,567.00", 1234567, 123456700],
  ])("reads %s", (raw, value, cents) => {
    expect(parseMoney(raw)).toEqual({ ok: true, raw, value, cents });
  });

  it.each(["$1,19.20", "$24.9", "24.90", "$24.90 /bag", "$1195.2", "NZ$24.90"])(
    "refuses %s as ambiguous instead of guessing",
    (raw) => {
      expect(parseMoney(raw)).toMatchObject({ ok: false, code: "AMBIGUOUS_NUMBER_FORMAT", raw });
    },
  );

  it.each(["", "TBC", "N/A", "-", "—", "see attached"])("refuses %j as missing", (raw) => {
    expect(parseMoney(raw)).toMatchObject({ ok: false, code: "MISSING_VALUE", raw });
  });
});

describe("parsePrice", () => {
  it("reads a plain price with no basis", () => {
    expect(parsePrice("$24.90")).toEqual({ ok: true, raw: "$24.90", value: 24.9, cents: 2490 });
  });

  it.each([
    ["$68.00 /bag", 68, "bag"],
    ["$0.09 /ea", 0.09, "ea"],
    ["$4.20 /bundle", 4.2, "bundle"],
    ["$11.50/ea", 11.5, "ea"],
  ])("reads %s with its price basis", (raw, value, basis) => {
    expect(parsePrice(raw)).toMatchObject({ ok: true, raw, value, basis });
  });

  it("keeps the raw text exactly as printed", () => {
    expect(parsePrice("$68.00 /bag")).toMatchObject({ raw: "$68.00 /bag" });
  });

  it.each(["$68.00 /", "$68.00 per bag", "$68 /bag"])("refuses %s", (raw) => {
    expect(parsePrice(raw)).toMatchObject({ ok: false, code: "AMBIGUOUS_NUMBER_FORMAT" });
  });

  it.each(["TBC", "N/A", "n/a", "-"])("refuses %j as a missing price, not a price basis", (raw) => {
    expect(parsePrice(raw)).toMatchObject({ ok: false, code: "MISSING_VALUE", raw });
  });
});

describe("parseQuantity", () => {
  it.each([
    ["48", 48],
    ["1200", 1200],
    ["1,200", 1200],
    ["2.5", 2.5],
    ["0.75", 0.75],
    ["0.500", 0.5],
  ])("reads %s", (raw, value) => {
    expect(parseQuantity(raw)).toEqual({ ok: true, raw, value });
  });

  it.each(["1.250", "12.500"])("refuses %s because it could be thousands or decimals", (raw) => {
    expect(parseQuantity(raw)).toMatchObject({ ok: false, code: "AMBIGUOUS_NUMBER_FORMAT", raw });
  });

  it.each(["12m2", "approx 20", "1,20", "10-12", "4 bags"])("refuses %s as ambiguous", (raw) => {
    expect(parseQuantity(raw)).toMatchObject({ ok: false, code: "AMBIGUOUS_NUMBER_FORMAT", raw });
  });

  it.each(["", "TBC", "n/a", "see attached"])("refuses %j as missing", (raw) => {
    expect(parseQuantity(raw)).toMatchObject({ ok: false, code: "MISSING_VALUE", raw });
  });
});

describe("isMissingToken", () => {
  it.each(["", "  ", "TBC", "tbc", "N/A", "-", "—", "See attached"])("treats %j as missing", (raw) => {
    expect(isMissingToken(raw)).toBe(true);
  });

  it.each(["0", "$0.00", "none"])("does not treat %j as missing", (raw) => {
    expect(isMissingToken(raw)).toBe(false);
  });
});

describe("measurementBasis", () => {
  it("accepts a weight that says it is the total", () => {
    expect(measurementBasis("480g total")).toBe("total");
  });

  it.each(["25kg", "1.2kg", "650g", "25 kg"])("flags %s because it doesn't say per item or per line", (raw) => {
    expect(measurementBasis(raw)).toBe("unstated");
  });

  it.each(["see individual lines", "", "blue"])("ignores %j because it isn't a measurement", (raw) => {
    expect(measurementBasis(raw)).toBeNull();
  });
});
