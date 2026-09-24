import { TriangleAlert } from "lucide-react";
import type { Refusal } from "@/lib/schema";

export function CompactNote({ refusal }: { refusal: Refusal }) {
  return (
    <div className="flex gap-2 text-sm">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
      <div className="space-y-0.5">
        <p>{refusal.userMessage}</p>
        {refusal.suggestedAction && <p className="text-muted-foreground">What to do: {refusal.suggestedAction}</p>}
      </div>
    </div>
  );
}
