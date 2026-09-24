import type { TextRun } from "./pdf";

export const ROW_Y_TOLERANCE = 2;

export type Row = {
  index: number;
  y: number;
  runs: TextRun[];
  text: string;
};

export function groupRows(runs: TextRun[]): Row[] {
  const byY = [...runs].sort((a, b) => b.y - a.y || a.x - b.x);
  const groups: TextRun[][] = [];
  for (const run of byY) {
    const current = groups[groups.length - 1];
    if (current && Math.abs(current[0].y - run.y) <= ROW_Y_TOLERANCE) current.push(run);
    else groups.push([run]);
  }
  return groups.map((group, index) => {
    const sorted = group.sort((a, b) => a.x - b.x);
    return { index, y: sorted[0].y, runs: sorted, text: sorted.map((run) => run.str).join(" ") };
  });
}

export function toPageText(rows: Row[]): string {
  return rows.map((row) => row.text).join("\n");
}
