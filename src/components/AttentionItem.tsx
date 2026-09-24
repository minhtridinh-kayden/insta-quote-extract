import { Card, CardContent } from "@/components/ui/card";
import { pageAnchor, pagesOf, whereLabel } from "@/lib/client";
import type { Refusal } from "@/lib/schema";
import { CandidateList } from "./CandidateList";
import { SourceLine } from "./SourceLine";

export function AttentionItem({ refusal }: { refusal: Refusal }) {
  return (
    <li id={refusal.id} className="scroll-mt-4">
      <Card className="ring-warning/50">
        <CardContent className="space-y-3">
          <p>{refusal.userMessage}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{whereLabel(refusal)}</p>
            {refusal.sourceText && <SourceLine sourceText={refusal.sourceText} raw={refusal.raw} />}
          </div>
          {refusal.candidates && refusal.candidates.length > 1 && <CandidateList candidates={refusal.candidates} />}
          {refusal.suggestedAction && <p className="font-medium">What to do: {refusal.suggestedAction}</p>}
          <p className="flex flex-wrap gap-x-3 text-sm">
            {pagesOf(refusal).map((page) => (
              <a key={page} href={`#${pageAnchor(page)}`} className="text-warning-foreground underline underline-offset-4">
                Go to page {page}
              </a>
            ))}
          </p>
        </CardContent>
      </Card>
    </li>
  );
}
