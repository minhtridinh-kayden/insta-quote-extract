import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("toolchain", () => {
  it("loads fixtures and zod", () => {
    const expected = z.record(z.string(), z.unknown()).parse(
      JSON.parse(readFileSync("fixtures/expected.json", "utf8")),
    );
    expect(Object.keys(expected)).toContain("KBS-10234.pdf");
  });
});
