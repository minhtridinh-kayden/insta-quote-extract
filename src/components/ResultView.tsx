import type { ExtractionResult } from "@/lib/schema";
import { AttentionList } from "./AttentionList";
import { ResultSummary } from "./ResultSummary";

export function ResultView({ result }: { result: ExtractionResult }) {
  return (
    <div className="space-y-6">
      <ResultSummary result={result} />
      <AttentionList refusals={result.refusals} />
    </div>
  );
}
