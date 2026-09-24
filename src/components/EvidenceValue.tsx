"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Evidenced } from "@/lib/schema";
import { SourceLine } from "./SourceLine";

export function EvidenceValue({ value }: { value: Evidenced<unknown> }) {
  return (
    <Popover>
      <PopoverTrigger className="rounded-sm px-1 text-left underline decoration-dotted underline-offset-4 hover:bg-warning/15 focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-warning/20">
        {value.raw}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 max-w-[85vw] space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Printed on page {value.evidence.page}
        </p>
        <SourceLine sourceText={value.evidence.sourceText} raw={value.raw} />
      </PopoverContent>
    </Popover>
  );
}
