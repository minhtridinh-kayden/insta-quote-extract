import { highlight } from "@/lib/client";

export function SourceLine({ sourceText, raw }: { sourceText: string; raw?: string }) {
  const { before, match, after } = highlight(sourceText, raw ?? "");
  return (
    <q className="block break-words font-mono text-xs text-muted-foreground before:content-none after:content-none">
      {before}
      {match && <mark className="rounded-sm bg-warning/30 px-0.5 text-foreground">{match}</mark>}
      {after}
    </q>
  );
}
