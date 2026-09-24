import type { TextRun } from "./types";

type TextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

function isTextItem(item: unknown): item is TextItem {
  return typeof item === "object" && item !== null && "str" in item && "transform" in item;
}

export function toTextRuns(items: unknown[]): TextRun[] {
  return items.filter(isTextItem).flatMap((item) => {
    const str = item.str.trim();
    if (!str) return [];
    return [{ str, x: item.transform[4], y: item.transform[5], w: item.width, h: item.height }];
  });
}
