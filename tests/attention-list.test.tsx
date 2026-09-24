import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttentionList } from "@/components/AttentionList";
import { fixtureResult } from "./helpers/results";

const sourceRow = (pattern: RegExp) => (_: string, element: Element | null) =>
  element?.tagName === "Q" && pattern.test(element.textContent ?? "");

describe("AttentionList", () => {
  it("shows both pallet counts side by side with their own source rows, choosing neither", async () => {
    const { refusals } = await fixtureResult("KBS-10262.pdf");
    render(<AttentionList refusals={refusals} />);
    const candidateList = screen.getByText("What the document says:").nextElementSibling as HTMLElement;
    const candidates = within(candidateList).getAllByRole("listitem");
    expect(candidates.map((li) => li.querySelector("p")?.textContent)).toEqual(["14 pallets", "16 pallets"]);
    expect(within(candidates[0]).getByText(sourceRow(/^Summary: 14 pallets loaded at depot/))).toBeInTheDocument();
    expect(within(candidates[1]).getByText(sourceRow(/^Driver notes: 16 pallets unloaded at site/))).toBeInTheDocument();
  });

  it("shows where a refusal is and the printed row it refers to", async () => {
    const { refusals } = await fixtureResult("KBS-10255.pdf");
    render(<AttentionList refusals={refusals} />);
    const weight = screen.getByText(/The weight for "Galv nails 90mm, bulk"/).closest("li")!;
    expect(within(weight).getByText("Page 1")).toBeInTheDocument();
    expect(within(weight).getByText("25kg", { selector: "mark" })).toBeInTheDocument();
    expect(within(weight).getByText(/^What to do:/)).toBeInTheDocument();
  });

  it("shows a single printed total once, not as competing values", async () => {
    const { refusals } = await fixtureResult("KBS-10270.pdf");
    render(<AttentionList refusals={refusals} />);
    expect(screen.queryByText("What the document says:")).not.toBeInTheDocument();
    expect(screen.getByText("$1,612.90", { selector: "mark" })).toBeInTheDocument();
  });

  it("never shows refusal codes to the user", async () => {
    const { refusals } = await fixtureResult("KBS-DR118.pdf");
    const { container } = render(<AttentionList refusals={refusals} />);
    expect(container.textContent).not.toMatch(/[A-Z]+_[A-Z_]+/);
  });

  it("renders nothing when there is nothing to review", () => {
    const { container } = render(<AttentionList refusals={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
