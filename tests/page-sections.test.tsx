import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttentionList } from "@/components/AttentionList";
import { PageSections } from "@/components/PageSections";
import { PageStrip } from "@/components/PageStrip";
import { fixtureResult } from "./helpers/results";

const section = (page: number) => document.getElementById(`page-${page}`)!;

describe("PageSections", () => {
  it("keeps a page that wasn't read in place, with the reason on it", async () => {
    render(<PageSections result={await fixtureResult("KBS-DR118.pdf")} />);
    const page4 = section(4);
    expect(within(page4).getByText("Scanned, not read")).toBeInTheDocument();
    expect(page4).toHaveTextContent("Page 4 is a scanned image");
    expect(page4).toHaveTextContent("No line items were read from this page.");
    expect(section(3).compareDocumentPosition(page4) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows a page's own notes under its heading, not somewhere else", async () => {
    render(<PageSections result={await fixtureResult("KBS-DR118.pdf")} />);
    expect(section(6)).toHaveTextContent("Page 6 is a Returns Note");
    expect(section(5)).not.toHaveTextContent("Page 6 is a Returns Note");
    expect(section(1)).not.toHaveTextContent("What to do:");
  });

  it("highlights a row with a problem and puts its note directly beneath it", async () => {
    const { container } = render(<PageSections result={await fixtureResult("KBS-10255.pdf")} />);
    const row = container.querySelector('[data-line-id="p1-l1"]')!;
    const note = row.nextElementSibling!;
    expect(row.className).toContain("bg-warning");
    expect(note).toHaveAttribute("data-notes-for", "p1-l1");
    expect(note).toHaveTextContent('The weight for "Galv nails 90mm, bulk" on page 1 is "25kg"');
    expect(container.querySelector('[data-line-id="p1-l2"]')!.className).not.toContain("bg-warning");
    expect(container.querySelector('[data-notes-for="p1-l2"]')).toBeNull();
  });

  it("shows 'Not on document' for columns the page doesn't have, never blank or $0.00", async () => {
    const { container } = render(<PageSections result={await fixtureResult("KBS-10255.pdf")} />);
    for (const row of container.querySelectorAll("[data-line-id]")) {
      const cells = within(row as HTMLElement).getAllByRole("cell");
      expect(cells[3]).toHaveTextContent("Not on document");
      expect(cells[5]).toHaveTextContent("Not on document");
      expect(row).not.toHaveTextContent("$0.00");
    }
  });

  it("says a printed value couldn't be read, and explains why right under the row", async () => {
    const result = await fixtureResult("KBS-10234.pdf");
    const refusal = {
      id: "r-AMBIGUOUS_NUMBER_FORMAT-p1-l1-quantity",
      code: "AMBIGUOUS_NUMBER_FORMAT" as const,
      scope: "field" as const,
      page: 1,
      lineId: "p1-l1",
      field: "quantity" as const,
      userMessage: 'The quantity for "10mm GIB Standard board 2400x1200" on page 1 is printed as "1.250".',
      technicalDetail: "",
    };
    const [first, ...rest] = result.lineItems;
    const { container } = render(
      <PageSections
        result={{ ...result, lineItems: [{ ...first, quantity: undefined, refusalIds: [refusal.id] }, ...rest], refusals: [refusal] }}
      />,
    );
    const row = container.querySelector('[data-line-id="p1-l1"]')!;
    expect(within(row as HTMLElement).getAllByRole("cell")[2]).toHaveTextContent("Can't read");
    expect(row.nextElementSibling).toHaveTextContent(refusal.userMessage);
  });

  it("keeps an extra column whose every value was refused", async () => {
    const result = await fixtureResult("KBS-10255.pdf");
    render(<PageSections result={{ ...result, lineItems: result.lineItems.map((line) => ({ ...line, extra: {} })) }} />);
    expect(screen.getByRole("columnheader", { name: "Weight" })).toBeInTheDocument();
    expect(screen.getAllByText("Can't read")).toHaveLength(3);
  });

  it("opens the evidence for a value and closes it with Escape", async () => {
    render(<PageSections result={await fixtureResult("KBS-10234.pdf")} />);
    const total = screen.getByRole("button", { name: "$1,195.20" });
    fireEvent.click(total);
    expect(total).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(total.getAttribute("aria-controls")!)!;
    expect(panel).toHaveTextContent("Printed on page 1");
    expect(within(panel).getByText("$1,195.20", { selector: "mark" })).toBeInTheDocument();
    fireEvent.keyDown(total, { key: "Escape" });
    expect(total).toHaveAttribute("aria-expanded", "false");
  });
});

describe("navigation between the overview and the pages", () => {
  it("links each page chip to its page section", async () => {
    render(<PageStrip result={await fixtureResult("KBS-DR118.pdf")} />);
    expect(screen.getByRole("link", { name: "p4 · Scanned, not read" })).toHaveAttribute("href", "#page-4");
  });

  it("links each attention item to the page it is about", async () => {
    render(<AttentionList refusals={(await fixtureResult("KBS-DR118.pdf")).refusals} />);
    expect(screen.getByRole("link", { name: "Go to page 6" })).toHaveAttribute("href", "#page-6");
  });

  it("links a document-wide conflict to the page its values are printed on", async () => {
    render(<AttentionList refusals={(await fixtureResult("KBS-10262.pdf")).refusals} />);
    expect(screen.getByRole("link", { name: "Go to page 1" })).toHaveAttribute("href", "#page-1");
  });
});

describe("status colours", () => {
  it("marks OK pages green, pages to check amber, and unread pages red, each with its own word", async () => {
    render(<PageStrip result={await fixtureResult("KBS-DR118.pdf")} />);
    const variant = (name: string) => screen.getByRole("link", { name }).getAttribute("data-variant");
    expect(variant("p1 · Delivery · OK")).toBe("success");
    expect(variant("p5 · Summary · Check")).toBe("warning");
    expect(variant("p4 · Scanned, not read")).toBe("destructive");
  });
});
