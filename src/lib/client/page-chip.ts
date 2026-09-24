import type { PageSummary, Refusal, RefusalCode } from "@/lib/schema";
import { SECTION_LABELS } from "./sections";

export type PageChip = { label: string; status: PageSummary["status"] };

const REFUSED_REASON: Partial<Record<RefusalCode, string>> = {
  NO_TEXT_LAYER: "Scanned, not read",
  PAGE_PARSE_FAILED: "Couldn't be read",
  UNRECOGNISED_LAYOUT: "Layout not recognised",
};

const STATUS_WORDS: Record<PageSummary["status"], string> = {
  ok: "OK",
  needs_review: "Check",
  refused: "Not read",
};

export function pageChip(page: PageSummary, refusals: Refusal[]): PageChip {
  const parts = [`p${page.page}`];
  if (page.section) parts.push(SECTION_LABELS[page.section.value]);
  const reason = refusals.find((r) => r.page === page.page && REFUSED_REASON[r.code]);
  parts.push(page.status === "refused" && reason ? REFUSED_REASON[reason.code]! : STATUS_WORDS[page.status]);
  return { label: parts.join(" · "), status: page.status };
}
