import type { Refusal } from "@/lib/schema";
import type { CountMention } from "../notes";
import { makeRefusal } from "../refusal";

const rowOf = (mention: CountMention) => `${mention.count.evidence.page}:${mention.count.evidence.sourceText}`;

function contradicts(group: CountMention[]): boolean {
  return group.some((a) => group.some((b) => a.count.value !== b.count.value && rowOf(a) !== rowOf(b)));
}

export function conflictingCountRefusals(mentions: CountMention[]): Refusal[] {
  const byNoun = Map.groupBy(mentions, (mention) => mention.noun.singular);
  return [...byNoun.values()].flatMap((group) => {
    if (!contradicts(group)) return [];
    const { plural, singular } = group[0].noun;
    return [
      makeRefusal({
        code: "CONFLICTING_VALUES",
        scope: "document",
        key: singular,
        candidates: group.map((m) => m.count),
        message: { countNoun: plural, raws: group.map((m) => m.count.raw) },
        technicalDetail: `${group.length} different "${singular}" counts on pages ${group.map((m) => m.count.evidence.page).join(", ")}`,
      }),
    ];
  });
}
