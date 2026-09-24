import { whereLabel } from "@/lib/client";
import type { Refusal } from "@/lib/schema";
import { CandidateList } from "./CandidateList";
import { SourceLine } from "./SourceLine";

export function AttentionItem({ refusal }: { refusal: Refusal }) {
  return (
    <li id={refusal.id} className="space-y-3 rounded-lg border border-amber-300 bg-white p-4">
      <p>{refusal.userMessage}</p>
      <div className="space-y-1">
        <p className="text-sm font-medium text-stone-600">{whereLabel(refusal)}</p>
        {refusal.sourceText && <SourceLine sourceText={refusal.sourceText} raw={refusal.raw} />}
      </div>
      {refusal.candidates && refusal.candidates.length > 1 && <CandidateList candidates={refusal.candidates} />}
      {refusal.suggestedAction && <p className="font-medium">What to do: {refusal.suggestedAction}</p>}
    </li>
  );
}
