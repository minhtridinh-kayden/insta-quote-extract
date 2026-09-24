import type { ExtractionResult } from "@/lib/schema";
import { AttentionList } from "./AttentionList";
import { LineItemTable } from "./LineItemTable";
import { PageStrip } from "./PageStrip";
import { ResultSummary } from "./ResultSummary";

export function ResultView({ result }: { result: ExtractionResult }) {
  return (
    <div className="space-y-6">
      <ResultSummary result={result} />
      <PageStrip result={result} />
      <AttentionList refusals={result.refusals} />
      <LineItemTable result={result} />
    </div>
  );
}
