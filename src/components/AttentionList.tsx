import { plural } from "@/lib/client";
import type { Refusal } from "@/lib/schema";

export function AttentionList({ refusals }: { refusals: Refusal[] }) {
  if (refusals.length === 0) return null;
  return (
    <section aria-labelledby="attention-heading" className="space-y-3">
      <h2 id="attention-heading" className="text-lg font-semibold">
        Needs your attention ({plural(refusals.length, "item")})
      </h2>
      <ul className="space-y-3">
        {refusals.map((refusal) => (
          <li key={refusal.id} id={refusal.id} className="rounded-lg border border-amber-300 bg-white p-4">
            <p>{refusal.userMessage}</p>
            {refusal.suggestedAction && <p className="mt-2 font-medium">{refusal.suggestedAction}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
