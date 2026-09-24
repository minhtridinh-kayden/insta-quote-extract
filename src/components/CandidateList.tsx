import type { Refusal } from "@/lib/schema";
import { SourceLine } from "./SourceLine";

export function CandidateList({ candidates }: { candidates: NonNullable<Refusal["candidates"]> }) {
  return (
    <div>
      <p className="text-sm font-medium text-stone-600">What the document says:</p>
      <ul className="mt-1 grid gap-2 sm:grid-cols-2">
        {candidates.map((candidate, i) => (
          <li key={i} className="rounded border border-stone-200 bg-stone-50 p-3">
            <p className="text-lg font-semibold">{candidate.raw}</p>
            <p className="text-xs text-stone-500">Page {candidate.evidence.page}</p>
            <SourceLine sourceText={candidate.evidence.sourceText} raw={candidate.raw} />
          </li>
        ))}
      </ul>
    </div>
  );
}
