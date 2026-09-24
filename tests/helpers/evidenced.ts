import type { Evidenced, ExtractionResult } from "@/lib/schema";

export type Located = { path: string; value: Evidenced<unknown> };

export function allEvidenced(result: ExtractionResult): Located[] {
  const found: Located[] = [];
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) return node.forEach((item, i) => visit(item, `${path}[${i}]`));
    if (typeof node !== "object" || node === null) return;
    if ("raw" in node && "evidence" in node && typeof node.raw === "string") {
      found.push({ path, value: node as Evidenced<unknown> });
    }
    for (const [key, child] of Object.entries(node)) visit(child, `${path}.${key}`);
  };
  visit(result, "result");
  return found;
}
