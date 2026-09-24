import type { Refusal, RefusalScope } from "@/lib/schema";

const SCOPE_ORDER: Record<RefusalScope, number> = { document: 0, page: 1, line: 2, field: 3 };

export function sortRefusals(refusals: Refusal[]): Refusal[] {
  return [...refusals].sort(
    (a, b) =>
      SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope] ||
      (a.page ?? 0) - (b.page ?? 0) ||
      (a.lineId ?? "").localeCompare(b.lineId ?? "", undefined, { numeric: true }),
  );
}

export function whereLabel(refusal: Refusal): string {
  if (refusal.page === undefined) return "Whole document";
  return refusal.scope === "document" ? `Page ${refusal.page} (affects the whole document)` : `Page ${refusal.page}`;
}
