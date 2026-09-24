import { pageChip } from "@/lib/client";
import type { ExtractionResult, PageSummary } from "@/lib/schema";

const STATUS_CLASSES: Record<PageSummary["status"], string> = {
  ok: "border-stone-300 bg-white",
  needs_review: "border-amber-400 bg-amber-50",
  refused: "border-red-400 bg-red-50",
};

const STATUS_MARK: Record<PageSummary["status"], string> = { ok: "✓", needs_review: "⚠", refused: "✕" };

export function PageStrip({ result }: { result: ExtractionResult }) {
  return (
    <nav aria-label="Pages in this file">
      <ul className="flex flex-wrap gap-2">
        {result.pages.map((page) => {
          const chip = pageChip(page, result.refusals);
          return (
            <li key={page.page} className={`rounded-full border px-3 py-1 text-sm ${STATUS_CLASSES[chip.status]}`}>
              <span aria-hidden="true">{STATUS_MARK[chip.status]} </span>
              {chip.label}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
