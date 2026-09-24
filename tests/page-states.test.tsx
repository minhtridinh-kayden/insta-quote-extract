import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { REQUEST_ID_HEADER } from "@/lib/schema";
import { GENERIC_FAILURE } from "./helpers/generic-failure";
import { fixtureResult } from "./helpers/results";

type Reply = { status: number; body: unknown; headers?: Record<string, string> };

function mockFetch(reply: Reply | (() => Promise<Response>)) {
  const fetchMock = vi.fn(
    typeof reply === "function"
      ? reply
      : () =>
          Promise.resolve(
            new Response(typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body), {
              status: reply.status,
              headers: reply.headers,
            }),
          ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function uploadDocument(name = "delivery.pdf") {
  const view = render(<Home />);
  const file = new File(["%PDF-1.4"], name, { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText(/Supplier document/), { target: { files: [file] } });
  fireEvent.click(screen.getByRole("button", { name: /Read document/ }));
  return view;
}

const refusal = {
  id: "r-NOT_A_PDF-doc",
  code: "NOT_A_PDF",
  scope: "document",
  userMessage: '"delivery.pdf" isn\'t a PDF file, so we couldn\'t read it.',
  suggestedAction: "Upload the original PDF you got from the supplier.",
  technicalDetail: "missing %PDF- signature",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("while the file is being read", () => {
  it("shows the file name, a skeleton, and a disabled button", async () => {
    mockFetch(() => new Promise<Response>(() => {}));
    const { container } = uploadDocument("KBS-DR118.pdf");
    expect(await screen.findByText("Uploading and reading KBS-DR118.pdf…")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Reading…/ })).toBeDisabled();
  });
});

describe("each outcome shows its own reason", () => {
  it("200 with everything refused: explains the scan", async () => {
    mockFetch({ status: 200, body: await fixtureResult("KBS-10241.pdf") });
    const { container } = uploadDocument("KBS-10241.pdf");
    expect(
      await screen.findByText("This file is a scanned image, so there was no text for us to read. Nothing was extracted."),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(GENERIC_FAILURE);
  });

  it("422: shows the refusal message, what to do, and the reference", async () => {
    mockFetch({ status: 422, body: { refusal, requestId: "req-422" } });
    const { container } = uploadDocument();
    expect(await screen.findByText(refusal.userMessage)).toBeInTheDocument();
    expect(screen.getByText(refusal.suggestedAction)).toBeInTheDocument();
    expect(screen.getByText("req-422")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(GENERIC_FAILURE);
  });

  it("413 from the platform: states the size limit, not an unknown response", async () => {
    const fetchMock = mockFetch({ status: 413, body: "Request Entity Too Large" });
    const { container } = uploadDocument();
    expect(await screen.findByText(/bigger than the 4 MB we can accept/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(container.textContent).not.toMatch(/couldn't understand/);
  });

  it("400: says no file was received", async () => {
    const body = { error: { code: "NO_FILE", userMessage: "We didn't receive a file. Choose a PDF and try again.", requestId: "req-400" } };
    mockFetch({ status: 400, body });
    uploadDocument();
    expect(await screen.findByText(body.error.userMessage)).toBeInTheDocument();
  });

  it("500: shows the honest message and the request id", async () => {
    const userMessage =
      "We couldn't finish reading this file because of a problem on our side, not with your document. Please try again. If it happens again, give us this reference: req-500.";
    mockFetch({ status: 500, body: { error: { code: "INTERNAL", userMessage, requestId: "req-500" } } });
    const { container } = uploadDocument();
    expect(await screen.findByText(userMessage)).toBeInTheDocument();
    expect(screen.getByText("req-500")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(GENERIC_FAILURE);
  });

  it("network failure: says the server couldn't be reached", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    const { container } = uploadDocument();
    expect(await screen.findByText("Couldn't reach the server. Check your connection and try again.")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(GENERIC_FAILURE);
  });

  it("a body that isn't JSON: says the response couldn't be understood, with the header reference", async () => {
    mockFetch({ status: 200, body: "<html>oops</html>", headers: { [REQUEST_ID_HEADER]: "req-html" } });
    uploadDocument();
    expect(await screen.findByText(/The server sent a response we couldn't understand/)).toHaveTextContent("req-html");
  });

  it("a body that fails the shared schema: is not shown as a result", async () => {
    const result = await fixtureResult("KBS-10234.pdf");
    mockFetch({ status: 200, body: { ...result, lineItems: [{ ...result.lineItems[0], id: "line-1" }] } });
    uploadDocument();
    expect(await screen.findByText(/The server sent a response we couldn't understand/)).toBeInTheDocument();
    expect(screen.queryByText("Page by page, as printed")).not.toBeInTheDocument();
  });
});

describe("a file over the limit", () => {
  it("is refused in the browser without being uploaded", async () => {
    const fetchMock = mockFetch({ status: 200, body: {} });
    render(<Home />);
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Supplier document/), { target: { files: [big] } });
    fireEvent.click(screen.getByRole("button", { name: /Read document/ }));
    expect(await screen.findByText(/bigger than the 4 MB we can accept/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
