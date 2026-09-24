import { summarise } from "@/lib/client";
import type { ExtractionResult } from "@/lib/schema";
import { Notice, type NoticeTone } from "./Notice";

const TONE: Record<ExtractionResult["status"], NoticeTone> = {
  complete: "success",
  needs_review: "warning",
  nothing_extracted: "warning",
};

export function ResultSummary({ result }: { result: ExtractionResult }) {
  const { headline, detail } = summarise(result);
  return (
    <Notice tone={TONE[result.status]} title={result.fileName}>
      <p>{headline}</p>
      {detail && <p>{detail}</p>}
    </Notice>
  );
}
