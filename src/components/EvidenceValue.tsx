"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { Evidenced } from "@/lib/schema";
import { SourceLine } from "./SourceLine";

export function EvidenceValue({ value }: { value: Evidenced<unknown> }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") setOpen(false);
  };

  return (
    <span className="inline-block" onKeyDown={closeOnEscape}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="rounded px-1 text-left underline decoration-dotted underline-offset-4 hover:bg-amber-100 focus:outline-2 focus:outline-amber-500"
      >
        {value.raw}
      </button>
      {open && (
        <span
          id={panelId}
          role="note"
          className="mt-1 block w-64 max-w-[75vw] rounded-lg border border-stone-300 bg-white p-3 text-left shadow-sm"
        >
          <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Printed on page {value.evidence.page}
          </span>
          <SourceLine sourceText={value.evidence.sourceText} raw={value.raw} />
        </span>
      )}
    </span>
  );
}
