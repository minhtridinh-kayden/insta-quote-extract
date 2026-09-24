import { z } from "zod";
import { RefusalSchema } from "./refusal";

export const EXTRACT_PATH = "/api/extract";
export const REQUEST_ID_HEADER = "x-request-id";

export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const RejectionBodySchema = z.object({
  refusal: RefusalSchema,
  requestId: z.string().min(1),
});

export type RejectionBody = z.infer<typeof RejectionBodySchema>;

export const ApiErrorCodeSchema = z.enum(["NO_FILE", "INTERNAL"]);

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    userMessage: z.string().min(1),
    requestId: z.string().min(1),
  }),
});

export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
