import { ApiErrorBodySchema, ExtractionResultSchema, MAX_UPLOAD_MB, RejectionBodySchema } from "@/lib/schema";
import type { SubmitOutcome } from "./outcome";

function invalid(status: number, requestId: string | undefined, detail: string): SubmitOutcome {
  return { kind: "invalidResponse", status, requestId, detail };
}

export function interpretResponse(status: number, body: unknown, headerRequestId?: string): SubmitOutcome {
  if (status === 200) {
    const parsed = ExtractionResultSchema.safeParse(body);
    return parsed.success ? { kind: "result", result: parsed.data } : invalid(status, headerRequestId, parsed.error.message);
  }
  if (status === 413 || status === 422) {
    const parsed = RejectionBodySchema.safeParse(body);
    if (!parsed.success && status === 413) return { kind: "tooLarge", maxMb: MAX_UPLOAD_MB };
    if (!parsed.success) return invalid(status, headerRequestId, parsed.error.message);
    return { kind: "rejected", status, refusal: parsed.data.refusal, requestId: parsed.data.requestId };
  }
  if (status === 400 || status === 500) {
    const parsed = ApiErrorBodySchema.safeParse(body);
    if (!parsed.success) return invalid(status, headerRequestId, parsed.error.message);
    const { userMessage, requestId } = parsed.data.error;
    return { kind: status === 400 ? "badRequest" : "serverError", message: userMessage, requestId };
  }
  return invalid(status, headerRequestId, `unexpected HTTP status ${status}`);
}
