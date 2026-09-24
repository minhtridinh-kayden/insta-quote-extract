import type { Evidenced } from "@/lib/schema";
import type { TextRun } from "./pdf";
import type { Row } from "./rows";

type BBox = [number, number, number, number];

function bboxOf(runs: TextRun[]): BBox {
  const left = Math.min(...runs.map((r) => r.x));
  const bottom = Math.min(...runs.map((r) => r.y));
  const right = Math.max(...runs.map((r) => r.x + r.w));
  const top = Math.max(...runs.map((r) => r.y + r.h));
  return [left, bottom, right - left, top - bottom];
}

export function fromRow<T>(page: number, row: Row, value: T): Evidenced<T> {
  return {
    value,
    raw: row.text,
    evidence: { page, sourceText: row.text, bbox: bboxOf(row.runs) },
    source: "document",
  };
}
