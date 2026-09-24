import type { ApiErrorBody, ApiErrorCode, ExtractionResult, Refusal, RejectionBody } from "@/lib/schema";
import { internalMessage, NO_FILE_MESSAGE } from "./messages";

export const REQUEST_ID_HEADER = "x-request-id";

const ERROR_STATUS: Record<ApiErrorCode, number> = { NO_FILE: 400, INTERNAL: 500 };

function json(status: number, body: unknown, requestId: string): Response {
  return Response.json(body, { status, headers: { [REQUEST_ID_HEADER]: requestId } });
}

export function resultResponse(result: ExtractionResult): Response {
  return json(200, result, result.requestId);
}

export function rejectionResponse(status: 413 | 422, refusal: Refusal, requestId: string): Response {
  const body: RejectionBody = { refusal, requestId };
  return json(status, body, requestId);
}

export function errorResponse(code: ApiErrorCode, requestId: string): Response {
  const userMessage = code === "NO_FILE" ? NO_FILE_MESSAGE : internalMessage(requestId);
  const body: ApiErrorBody = { error: { code, userMessage, requestId } };
  return json(ERROR_STATUS[code], body, requestId);
}
