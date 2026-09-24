import { describe, expect, it, vi } from "vitest";
import { handleExtract, REQUEST_ID_HEADER } from "@/lib/api";
import type { Logger, RequestLog } from "@/lib/api/log";
import { POST } from "@/app/api/extract/route";
import {
  ApiErrorBodySchema,
  ExtractionResultSchema,
  MAX_UPLOAD_BYTES,
  RejectionBodySchema,
} from "@/lib/schema";
import { EXPECTED_FIXTURES, expectedFor } from "./helpers/expected";
import { fixtureBytes } from "./helpers/fixtures";

function upload(bytes: Uint8Array, name: string): Request {
  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes)], name, { type: "application/pdf" }));
  return new Request("http://localhost/api/extract", { method: "POST", body: form });
}

function recordingLogger() {
  const entries: RequestLog[] = [];
  const failures: unknown[] = [];
  const logger: Logger = { request: (e) => entries.push(e), failure: (_id, error) => failures.push(error) };
  return { logger, entries, failures };
}

const quiet = () => recordingLogger().logger;

describe.each(EXPECTED_FIXTURES)("POST /api/extract with %s", (name) => {
  it("returns the expected status with a body the client schema accepts", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const response = await POST(upload(fixtureBytes(name), name));
    expect(response.status).toBe(expectedFor(name).httpStatus);
    const body = await response.json();
    expect(ExtractionResultSchema.parse(body)).toMatchObject({ status: expectedFor(name).status, fileName: name });
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(body.requestId);
  });
});

describe("refusals are not errors", () => {
  it("returns 200 for a document where everything was refused", async () => {
    const response = await handleExtract(upload(fixtureBytes("KBS-10241.pdf"), "KBS-10241.pdf"), { logger: quiet() });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "nothing_extracted", refusals: [{ code: "NO_TEXT_LAYER" }] });
  });

  it("returns 422 with a plain-language refusal for a text file renamed to .pdf", async () => {
    const response = await handleExtract(upload(new TextEncoder().encode("Invoice total $100.00"), "invoice.pdf"), {
      logger: quiet(),
    });
    expect(response.status).toBe(422);
    const body = RejectionBodySchema.parse(await response.json());
    expect(body.refusal).toMatchObject({ code: "NOT_A_PDF", scope: "document" });
    expect(body.refusal.userMessage).toContain('"invoice.pdf" isn\'t a PDF file');
    expect(body.refusal.suggestedAction).toBeTruthy();
  });

  it("returns 413 with the limit in plain words for an oversized upload", async () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(new TextEncoder().encode("%PDF-"));
    const response = await handleExtract(upload(big, "big.pdf"), { logger: quiet() });
    expect(response.status).toBe(413);
    const body = RejectionBodySchema.parse(await response.json());
    expect(body.refusal).toMatchObject({ code: "FILE_TOO_LARGE" });
    expect(body.refusal.userMessage).toContain("4 MB");
  });

  it("refuses by declared size before reading a huge body", async () => {
    const request = new Request("http://localhost/api/extract", {
      method: "POST",
      headers: { "content-length": String(MAX_UPLOAD_BYTES * 10) },
      body: "x",
    });
    expect((await handleExtract(request, { logger: quiet() })).status).toBe(413);
  });
});

describe("bad requests", () => {
  it("returns 400 NO_FILE when the form has no file", async () => {
    const form = new FormData();
    form.append("other", "value");
    const response = await handleExtract(new Request("http://localhost/api/extract", { method: "POST", body: form }), {
      logger: quiet(),
    });
    expect(response.status).toBe(400);
    expect(ApiErrorBodySchema.parse(await response.json()).error).toMatchObject({ code: "NO_FILE" });
  });

  it("returns 400 NO_FILE, not 500, when the body isn't multipart", async () => {
    const request = new Request("http://localhost/api/extract", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
    expect((await handleExtract(request, { logger: quiet() })).status).toBe(400);
  });
});

describe("real failures", () => {
  it("returns an honest 500 with the request id and no internals", async () => {
    const { logger, failures } = recordingLogger();
    const response = await handleExtract(upload(fixtureBytes("KBS-10234.pdf"), "KBS-10234.pdf"), {
      extract: () => Promise.reject(new Error("pdf.js worker crashed at /srv/app/node_modules/x.js:12")),
      newRequestId: () => "req-500",
      logger,
    });
    expect(response.status).toBe(500);
    const { error } = ApiErrorBodySchema.parse(await response.json());
    expect(error).toMatchObject({ code: "INTERNAL", requestId: "req-500" });
    expect(error.userMessage).toContain("req-500");
    expect(error.userMessage).not.toMatch(/something went wrong|error occurred|worker|node_modules/i);
    expect(failures).toHaveLength(1);
  });
});

describe("logging", () => {
  it("still answers when the logger itself throws", async () => {
    const broken: Logger = {
      request: () => {
        throw new Error("log sink down");
      },
      failure: () => {
        throw new Error("log sink down");
      },
    };
    const response = await handleExtract(upload(fixtureBytes("KBS-10234.pdf"), "KBS-10234.pdf"), { logger: broken });
    expect(response.status).toBe(200);
  });

  it("logs one line per request with status, page count and refusal codes", async () => {
    const { logger, entries } = recordingLogger();
    await handleExtract(upload(fixtureBytes("KBS-DR118.pdf"), "KBS-DR118.pdf"), { logger, newRequestId: () => "req-log" });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ requestId: "req-log", status: 200, pageCount: 8 });
    expect(entries[0].refusalCodes).toEqual(expect.arrayContaining(["NO_TEXT_LAYER", "NON_DELIVERY_SECTION"]));
  });
});
