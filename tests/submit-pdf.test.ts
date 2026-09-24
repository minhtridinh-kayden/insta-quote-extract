import { describe, expect, it } from "vitest";
import { submitPdf } from "@/lib/client";
import { REQUEST_ID_HEADER } from "@/lib/schema";

const file = new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" });

const refusal = {
  id: "r-NOT_A_PDF-doc",
  code: "NOT_A_PDF",
  scope: "document",
  userMessage: '"doc.pdf" isn\'t a PDF file, so we couldn\'t read it.',
  suggestedAction: "Upload the original PDF you got from the supplier.",
  technicalDetail: "missing %PDF- signature",
};

const result = {
  requestId: "req-1",
  fileName: "doc.pdf",
  pageCount: 1,
  status: "nothing_extracted",
  pages: [{ page: 1, status: "refused", lineCount: 0 }],
  lineItems: [],
  documentTotals: [],
  refusals: [{ ...refusal, id: "r-NO_TEXT_LAYER-p1", code: "NO_TEXT_LAYER", scope: "page", page: 1 }],
};

const respond = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  (() => Promise.resolve(new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers }))) as typeof fetch;

describe("submitPdf", () => {
  it("returns a validated result for 200, even when everything was refused", async () => {
    expect(await submitPdf(file, respond(200, result))).toMatchObject({ kind: "result", result: { status: "nothing_extracted" } });
  });

  it.each([413, 422])("returns the refusal itself for %i", async (status) => {
    expect(await submitPdf(file, respond(status, { refusal, requestId: "req-2" }))).toEqual({
      kind: "rejected",
      status,
      refusal,
      requestId: "req-2",
    });
  });

  it("returns the server's own message for 400", async () => {
    const body = { error: { code: "NO_FILE", userMessage: "We didn't receive a file.", requestId: "req-3" } };
    expect(await submitPdf(file, respond(400, body))).toEqual({
      kind: "badRequest",
      message: "We didn't receive a file.",
      requestId: "req-3",
    });
  });

  it("returns the honest message and reference for 500", async () => {
    const body = { error: { code: "INTERNAL", userMessage: "A problem on our side. Reference: req-4.", requestId: "req-4" } };
    expect(await submitPdf(file, respond(500, body))).toMatchObject({ kind: "serverError", requestId: "req-4" });
  });

  it("reports a network failure when fetch throws", async () => {
    const offline = (() => Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch;
    expect(await submitPdf(file, offline)).toEqual({ kind: "networkError", detail: "Failed to fetch" });
  });

  it("reports an invalid response for a body that isn't JSON, keeping the header reference", async () => {
    const outcome = await submitPdf(file, respond(502, "<html>Bad gateway</html>", { [REQUEST_ID_HEADER]: "req-5" }));
    expect(outcome).toMatchObject({ kind: "invalidResponse", status: 502, requestId: "req-5" });
  });

  it("reports an invalid response when a 200 body fails the shared schema", async () => {
    const outcome = await submitPdf(file, respond(200, { ...result, status: "ok" }));
    expect(outcome).toMatchObject({ kind: "invalidResponse", status: 200 });
  });

  it("refuses an oversized file before uploading it", async () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.pdf");
    const neverCalled = (() => Promise.reject(new Error("should not upload"))) as typeof fetch;
    expect(await submitPdf(big, neverCalled)).toEqual({ kind: "tooLarge", maxMb: 4 });
  });

  it("treats the platform's own non-JSON 413 as too large, not as an unknown response", async () => {
    expect(await submitPdf(file, respond(413, "Request Entity Too Large"))).toEqual({ kind: "tooLarge", maxMb: 4 });
  });

  it("reports an invalid response for a status the API never sends", async () => {
    expect(await submitPdf(file, respond(404, { message: "not found" }))).toMatchObject({ kind: "invalidResponse", status: 404 });
  });
});
