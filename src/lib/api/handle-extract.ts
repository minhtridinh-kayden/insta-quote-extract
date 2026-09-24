import { extractDocument } from "@/lib/extraction/pipeline";
import { makeRefusal } from "@/lib/extraction/refusal";
import { MAX_UPLOAD_MB } from "@/lib/schema";
import { consoleLogger, safeLogger, type Logger, type RequestLog } from "./log";
import { readUpload } from "./read-upload";
import { errorResponse, rejectionResponse, resultResponse } from "./responses";

export type ExtractDeps = {
  extract?: typeof extractDocument;
  newRequestId?: () => string;
  logger?: Logger;
};

export async function handleExtract(request: Request, deps: ExtractDeps = {}): Promise<Response> {
  const { extract = extractDocument, newRequestId = () => crypto.randomUUID() } = deps;
  const logger = safeLogger(deps.logger ?? consoleLogger);
  const requestId = newRequestId();
  const started = Date.now();
  const respond = (response: Response, fields: Partial<RequestLog> = {}) => {
    logger.request({ requestId, status: response.status, durationMs: Date.now() - started, ...fields });
    return response;
  };

  try {
    const upload = await readUpload(request);
    if (upload.kind === "missing") return respond(errorResponse("NO_FILE", requestId), { detail: upload.detail });
    if (upload.kind === "too_large") {
      const refusal = makeRefusal({
        code: "FILE_TOO_LARGE",
        scope: "document",
        message: { maxMb: MAX_UPLOAD_MB },
        technicalDetail: `upload is ${upload.size} bytes`,
      });
      return respond(rejectionResponse(413, refusal, requestId), { refusalCodes: [refusal.code] });
    }

    const outcome = await extract(upload.bytes, { fileName: upload.fileName, requestId });
    if (outcome.kind === "refused") {
      return respond(rejectionResponse(422, outcome.refusal, requestId), { refusalCodes: [outcome.refusal.code] });
    }
    return respond(resultResponse(outcome.result), {
      pageCount: outcome.result.pageCount,
      refusalCodes: outcome.result.refusals.map((r) => r.code),
    });
  } catch (error) {
    logger.failure(requestId, error);
    return respond(errorResponse("INTERNAL", requestId));
  }
}
