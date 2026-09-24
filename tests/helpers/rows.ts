import { readPdf } from "@/lib/extraction/pdf";
import { groupRows, type Row } from "@/lib/extraction/rows";
import { fixtureBytes } from "./fixtures";

export async function fixturePageRows(name: string): Promise<Map<number, Row[]>> {
  const result = await readPdf(fixtureBytes(name));
  if (!result.ok) throw new Error(`${name}: ${result.failure.code}`);
  return new Map(result.pages.flatMap((p) => (p.kind === "text" ? [[p.page, groupRows(p.runs)]] : [])));
}
