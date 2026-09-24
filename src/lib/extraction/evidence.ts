import type { Evidenced } from "@/lib/schema";
import type { TextRun } from "./pdf";
import { joinRuns, type Row } from "./rows";

type BBox = [number, number, number, number];

function bboxOf(runs: TextRun[]): BBox {
  const left = Math.min(...runs.map((r) => r.x));
  const bottom = Math.min(...runs.map((r) => r.y));
  const right = Math.max(...runs.map((r) => r.x + r.w));
  const top = Math.max(...runs.map((r) => r.y + r.h));
  return [left, bottom, right - left, top - bottom];
}

export function fromRuns<T>(page: number, row: Row, runs: TextRun[], value: T): Evidenced<T> {
  return {
    value,
    raw: joinRuns(runs),
    evidence: { page, sourceText: row.text, bbox: bboxOf(runs) },
    source: "document",
  };
}

function runsCovering(row: Row, start: number, end: number): TextRun[] {
  let offset = 0;
  return row.runs.filter((run) => {
    const runStart = offset;
    offset += run.str.length + 1;
    return runStart < end && runStart + run.str.length > start;
  });
}

export function fromText<T>(page: number, row: Row, start: number, raw: string, value: T): Evidenced<T> {
  return {
    value,
    raw,
    evidence: { page, sourceText: row.text, bbox: bboxOf(runsCovering(row, start, start + raw.length)) },
    source: "document",
  };
}

export function fromRow<T>(page: number, row: Row, value: T): Evidenced<T> {
  return fromRuns(page, row, row.runs, value);
}
