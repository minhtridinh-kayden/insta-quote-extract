import { EXTRACT_PATH, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, REQUEST_ID_HEADER } from "@/lib/schema";
import { interpretResponse } from "./interpret-response";
import type { SubmitOutcome } from "./outcome";

export async function submitPdf(file: File, fetchImpl: typeof fetch = fetch): Promise<SubmitOutcome> {
  if (file.size > MAX_UPLOAD_BYTES) return { kind: "tooLarge", maxMb: MAX_UPLOAD_MB };

  const form = new FormData();
  form.append("file", file);

  let response: Response;
  try {
    response = await fetchImpl(EXTRACT_PATH, { method: "POST", body: form });
  } catch (error) {
    return { kind: "networkError", detail: error instanceof Error ? error.message : String(error) };
  }

  const requestId = response.headers.get(REQUEST_ID_HEADER) ?? undefined;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  return interpretResponse(response.status, body, requestId);
}
