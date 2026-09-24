import { describe, expect, it } from "vitest";
import { ApiErrorBodySchema, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, RejectionBodySchema } from "@/lib/schema";

const refusal = {
  id: "r-NOT_A_PDF-doc",
  code: "NOT_A_PDF",
  scope: "document",
  userMessage: '"notes.pdf" isn\'t a PDF file, so we couldn\'t read it.',
  suggestedAction: "Upload the original PDF you got from the supplier.",
  technicalDetail: "missing %PDF- signature",
};

describe("API response bodies", () => {
  it("accepts a rejection that carries a full refusal and a request id", () => {
    expect(RejectionBodySchema.safeParse({ refusal, requestId: "req-1" }).success).toBe(true);
  });

  it("rejects a rejection without a user message", () => {
    const withoutMessage = { ...refusal, userMessage: undefined };
    expect(RejectionBodySchema.safeParse({ refusal: withoutMessage, requestId: "req-1" }).success).toBe(false);
  });

  it("accepts only the known error codes, each with a message and request id", () => {
    const body = { error: { code: "INTERNAL", userMessage: "We couldn't finish reading this file.", requestId: "req-1" } };
    expect(ApiErrorBodySchema.safeParse(body).success).toBe(true);
    expect(ApiErrorBodySchema.safeParse({ error: { ...body.error, code: "OOPS" } }).success).toBe(false);
    expect(ApiErrorBodySchema.safeParse({ error: { ...body.error, requestId: "" } }).success).toBe(false);
  });

  it("states the upload limit once, in MB and bytes", () => {
    expect(MAX_UPLOAD_BYTES).toBe(MAX_UPLOAD_MB * 1024 * 1024);
  });
});
