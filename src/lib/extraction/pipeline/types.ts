import type { Evidenced, ExtractionResult, LineItem, Refusal } from "@/lib/schema";
import type { CountMention } from "../notes";
import type { TextRun } from "../pdf";
import type { PageSection } from "../section";

export type PageExtraction = {
  page: number;
  section?: PageSection;
  lines: LineItem[];
  refusals: Refusal[];
  totals: Evidenced<number>[];
  mentions: CountMention[];
  costNote?: string;
  pageLines: string[];
};

export type PageProcessor = (page: number, runs: TextRun[]) => PageExtraction;

export type PipelineOutcome =
  | { kind: "result"; result: ExtractionResult }
  | { kind: "refused"; refusal: Refusal };

export type PipelineInput = {
  fileName: string;
  requestId: string;
  processPage?: PageProcessor;
};
