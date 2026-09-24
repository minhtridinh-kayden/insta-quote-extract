import type { Evidenced } from "@/lib/schema";

export function lineLabel(description: Evidenced<string> | undefined, itemNo: Evidenced<number> | undefined, lineNo: number): string {
  return description?.raw ?? `item ${itemNo?.raw ?? lineNo}`;
}
