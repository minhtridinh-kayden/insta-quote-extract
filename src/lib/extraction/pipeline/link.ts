import type { LineItem, Refusal } from "@/lib/schema";

export function linkRefusals(lines: LineItem[], refusals: Refusal[]): LineItem[] {
  const byLine = Map.groupBy(
    refusals.filter((refusal) => refusal.lineId !== undefined),
    (refusal) => refusal.lineId!,
  );
  return lines.map((line) => {
    const ids = new Set([...line.refusalIds, ...(byLine.get(line.id) ?? []).map((r) => r.id)]);
    return { ...line, refusalIds: [...ids] };
  });
}
