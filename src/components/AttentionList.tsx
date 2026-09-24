import { plural, sortRefusals } from "@/lib/client";
import type { Refusal } from "@/lib/schema";
import { AttentionItem } from "./AttentionItem";

export function AttentionList({ refusals }: { refusals: Refusal[] }) {
  if (refusals.length === 0) return null;
  return (
    <section aria-labelledby="attention-heading" className="space-y-3">
      <h2 id="attention-heading" className="text-lg font-semibold">
        Needs your attention ({plural(refusals.length, "item")})
      </h2>
      <ul className="space-y-3">
        {sortRefusals(refusals).map((refusal) => (
          <AttentionItem key={refusal.id} refusal={refusal} />
        ))}
      </ul>
    </section>
  );
}
