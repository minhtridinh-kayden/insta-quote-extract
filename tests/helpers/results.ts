import { extractDocument } from "@/lib/extraction/pipeline";
import type { ExtractionResult } from "@/lib/schema";
import { fixtureBytes } from "./fixtures";

export async function fixtureResult(name: string): Promise<ExtractionResult> {
  const outcome = await extractDocument(fixtureBytes(name), { fileName: name, requestId: "req-test" });
  if (outcome.kind !== "result") throw new Error(`${name} was refused: ${outcome.refusal.code}`);
  return outcome.result;
}
