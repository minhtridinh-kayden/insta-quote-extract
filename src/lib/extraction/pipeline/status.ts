import type { LineItem, PageStatus, Refusal, ResultStatus } from "@/lib/schema";

export function pageStatus(lineCount: number, refusalCount: number): PageStatus {
  if (refusalCount === 0) return "ok";
  return lineCount === 0 ? "refused" : "needs_review";
}

export function resultStatus(lines: LineItem[], refusals: Refusal[]): ResultStatus {
  if (lines.length === 0) return "nothing_extracted";
  return refusals.length === 0 ? "complete" : "needs_review";
}
