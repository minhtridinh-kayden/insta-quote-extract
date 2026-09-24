import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineItemTable } from "@/components/LineItemTable";
import { PageStrip } from "@/components/PageStrip";
import { fixtureResult } from "./helpers/results";

describe("PageStrip", () => {
  it("shows the scanned page and the returns page in words", async () => {
    render(<PageStrip result={await fixtureResult("KBS-DR118.pdf")} />);
    expect(screen.getByText("p4 · Scanned, not read")).toBeInTheDocument();
    expect(screen.getByText("p6 · Returns note · Check")).toBeInTheDocument();
  });
});

describe("LineItemTable", () => {
  it("shows 'Not on document' for columns the packing list doesn't have, never blank or $0.00", async () => {
    render(<LineItemTable result={await fixtureResult("KBS-10255.pdf")} />);
    const rows = screen.getAllByRole("row").slice(1);
    for (const row of rows) {
      const cells = within(row).getAllByRole("cell");
      expect(cells[3]).toHaveTextContent("Not on document");
      expect(cells[5]).toHaveTextContent("Not on document");
      expect(row).not.toHaveTextContent("$0.00");
    }
    expect(within(rows[0]).getByRole("button", { name: "25kg" })).toBeInTheDocument();
  });

  it("opens the evidence for a value from the keyboard and closes it with Escape", async () => {
    render(<LineItemTable result={await fixtureResult("KBS-10234.pdf")} />);
    const total = screen.getByRole("button", { name: "$1,195.20" });
    total.focus();
    fireEvent.click(total);
    expect(total).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(total.getAttribute("aria-controls")!)!;
    expect(panel).toHaveTextContent("Printed on page 1");
    expect(within(panel).getByText("$1,195.20", { selector: "mark" })).toBeInTheDocument();
    fireEvent.keyDown(total, { key: "Escape" });
    expect(total).toHaveAttribute("aria-expanded", "false");
  });

  it("links a line to its refusals in the attention list", async () => {
    render(<LineItemTable result={await fixtureResult("KBS-10255.pdf")} />);
    const [first] = screen.getAllByRole("link", { name: "See note" });
    expect(first).toHaveAttribute("href", "#r-AMBIGUOUS_UNIT_BASIS-p1-l1-extra.Weight");
  });

  it("groups DR118 lines under a heading per page and section", async () => {
    render(<LineItemTable result={await fixtureResult("KBS-DR118.pdf")} />);
    expect(screen.getByRole("heading", { name: "Page 6 · Returns note" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Page 4/ })).not.toBeInTheDocument();
  });

  it("says a printed value couldn't be read, instead of claiming it isn't on the document", async () => {
    const result = await fixtureResult("KBS-10234.pdf");
    const refusal = {
      id: "r-AMBIGUOUS_NUMBER_FORMAT-p1-l1-quantity",
      code: "AMBIGUOUS_NUMBER_FORMAT" as const,
      scope: "field" as const,
      page: 1,
      lineId: "p1-l1",
      field: "quantity" as const,
      userMessage: "The quantity is printed as \"1.250\".",
      technicalDetail: "",
    };
    const [first, ...rest] = result.lineItems;
    render(
      <LineItemTable
        result={{ ...result, lineItems: [{ ...first, quantity: undefined, refusalIds: [refusal.id] }, ...rest], refusals: [refusal] }}
      />,
    );
    const cell = within(screen.getAllByRole("row")[1]).getAllByRole("cell")[2];
    expect(cell).toHaveTextContent("Can't read, see note");
    expect(within(cell).getByRole("link")).toHaveAttribute("href", `#${refusal.id}`);
  });

  it("keeps an extra column whose every value was refused", async () => {
    const result = await fixtureResult("KBS-10255.pdf");
    const lineItems = result.lineItems.map((line) => ({ ...line, extra: {} }));
    render(<LineItemTable result={{ ...result, lineItems }} />);
    expect(screen.getByRole("columnheader", { name: "Weight" })).toBeInTheDocument();
    expect(screen.getAllByText("Can't read, see note")).toHaveLength(3);
  });

  it("renders nothing when no lines were read", async () => {
    const { container } = render(<LineItemTable result={await fixtureResult("KBS-10241.pdf")} />);
    expect(container).toBeEmptyDOMElement();
  });
});
