"use client";

import { useState } from "react";
import { LoadingResult } from "@/components/LoadingResult";
import { OutcomeNotice } from "@/components/OutcomeNotice";
import { ResultView } from "@/components/ResultView";
import { UploadForm } from "@/components/UploadForm";
import { submitPdf, type RequestState } from "@/lib/client";

export default function Home() {
  const [state, setState] = useState<RequestState>({ phase: "idle" });

  const upload = async (file: File) => {
    setState({ phase: "uploading", fileName: file.name });
    const outcome = await submitPdf(file);
    setState({ phase: "finished", fileName: file.name, outcome });
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Read a supplier document</h1>
        <p className="text-muted-foreground">
          Upload a packing list, invoice or delivery docket. We only show numbers we can point to on the page, and we
          tell you plainly about anything we couldn&apos;t read.
        </p>
      </header>

      <UploadForm busy={state.phase === "uploading"} onSubmit={upload} />

      <div aria-live="polite">
        {state.phase === "uploading" && <LoadingResult fileName={state.fileName} />}
        {state.phase === "finished" &&
          (state.outcome.kind === "result" ? (
            <ResultView result={state.outcome.result} />
          ) : (
            <OutcomeNotice outcome={state.outcome} />
          ))}
      </div>
    </main>
  );
}
