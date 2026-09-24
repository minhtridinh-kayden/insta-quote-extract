import type { ExtractionResult, Refusal } from "@/lib/schema";

export type SubmitOutcome =
  | { kind: "result"; result: ExtractionResult }
  | { kind: "rejected"; status: 413 | 422; refusal: Refusal; requestId: string }
  | { kind: "badRequest"; message: string; requestId: string }
  | { kind: "serverError"; message: string; requestId: string }
  | { kind: "tooLarge"; maxMb: number }
  | { kind: "networkError"; detail: string }
  | { kind: "invalidResponse"; status: number; requestId?: string; detail: string };
