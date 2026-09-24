import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultView } from "@/components/ResultView";
import { EXPECTED_FIXTURES, expectedFor } from "./helpers/expected";
import { GENERIC_FAILURE, REFUSAL_CODE } from "./helpers/generic-failure";
import { fixtureResult } from "./helpers/results";

describe.each(EXPECTED_FIXTURES)("result screen for %s", (name) => {
  it("shows every refusal's message and next step exactly as the API sent them", async () => {
    const result = await fixtureResult(name);
    const { container } = render(<ResultView result={result} />);
    const text = container.textContent ?? "";
    for (const refusal of result.refusals) {
      expect(text).toContain(refusal.userMessage);
      if (refusal.suggestedAction) expect(text).toContain(refusal.suggestedAction);
    }
  });

  it("never shows a derived number the fixture forbids", async () => {
    const { container } = render(<ResultView result={await fixtureResult(name)} />);
    for (const derived of expectedFor(name).forbiddenInOutput) expect(container.textContent).not.toContain(derived);
  });

  it("never falls back to generic failure wording or shows internal codes", async () => {
    const { container } = render(<ResultView result={await fixtureResult(name)} />);
    expect(container.textContent).not.toMatch(GENERIC_FAILURE);
    expect(container.textContent).not.toMatch(REFUSAL_CODE);
  });
});

describe("a fully refused document", () => {
  it("explains the scan instead of reporting an empty result", async () => {
    const result = await fixtureResult("KBS-10241.pdf");
    render(<ResultView result={result} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This file is a scanned image, so there was no text for us to read. Nothing was extracted.",
    );
    expect(screen.getAllByText(result.refusals[0].userMessage)).toHaveLength(2);
    expect(document.getElementById("page-1")).toHaveTextContent(result.refusals[0].userMessage);
    expect(screen.getAllByText("p1 · Scanned, not read").length).toBeGreaterThan(0);
  });
});

describe("a total that doesn't add up", () => {
  it("shows the printed total the user should check", async () => {
    const { container } = render(<ResultView result={await fixtureResult("KBS-10270.pdf")} />);
    expect(container.textContent).toContain("$1,612.90");
  });
});

describe("a clean document", () => {
  it("shows a green, calm banner instead of a warning", async () => {
    render(<ResultView result={await fixtureResult("KBS-10234.pdf")} />);
    const banner = screen.getByText("We read 5 items from this page. Nothing needs your attention.").closest('[data-slot="alert"]')!;
    expect(banner).toHaveAttribute("role", "status");
    expect(banner.className).toContain("bg-success");
  });
});
