import { describe, expect, it } from "vitest";
import { summarise } from "@/lib/client";
import { extractDocument } from "@/lib/extraction/pipeline";
import type { ExtractionResult } from "@/lib/schema";
import { fixtureBytes } from "./helpers/fixtures";

async function resultOf(name: string): Promise<ExtractionResult> {
  const outcome = await extractDocument(fixtureBytes(name), { fileName: name, requestId: "req" });
  if (outcome.kind !== "result") throw new Error(name);
  return outcome.result;
}

describe("summarise", () => {
  it("explains a fully scanned file instead of saying nothing was found", async () => {
    const summary = summarise(await resultOf("KBS-10241.pdf"));
    expect(summary.headline).toBe("This file is a scanned image, so there was no text for us to read. Nothing was extracted.");
    expect(summary.detail).toContain("Upload the original digital PDF");
    expect(`${summary.headline} ${summary.detail}`).not.toMatch(/no items found|something went wrong|error/i);
  });

  it("gives a clean file a calm summary", async () => {
    expect(summarise(await resultOf("KBS-10234.pdf")).headline).toBe(
      "We read 5 items from this page. Nothing needs your attention.",
    );
  });

  it("counts pages, attention items and non-delivery lines in a multi-page run", async () => {
    const summary = summarise(await resultOf("KBS-DR118.pdf"));
    expect(summary.headline).toBe("We read 21 items from 7 of 8 pages. 5 things need your attention.");
    expect(summary.detail).toBe(
      "12 items are on summary, returns, credit or acceptance pages, so they aren't counted as delivered.",
    );
  });

  it("never claims a scan when nothing was refused", async () => {
    const empty = { ...(await resultOf("KBS-10241.pdf")), refusals: [] };
    expect(summarise(empty).headline).not.toContain("scanned");
  });

  it("uses the singular for one attention item", async () => {
    expect(summarise(await resultOf("KBS-10270.pdf")).headline).toBe(
      "We read 4 items from this page. 1 thing needs your attention.",
    );
  });
});
