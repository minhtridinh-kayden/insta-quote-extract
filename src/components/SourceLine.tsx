import { highlight } from "@/lib/client";

export function SourceLine({ sourceText, raw }: { sourceText: string; raw?: string }) {
  const { before, match, after } = highlight(sourceText, raw ?? "");
  return (
    <q className="block break-words font-mono text-sm text-stone-700 before:content-none after:content-none">
      {before}
      {match && <mark className="rounded bg-amber-200 px-0.5 text-stone-900">{match}</mark>}
      {after}
    </q>
  );
}
