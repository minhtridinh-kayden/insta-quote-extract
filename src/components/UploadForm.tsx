"use client";

import { useId, useState, type FormEvent } from "react";
import { MAX_UPLOAD_MB } from "@/lib/schema";

type UploadFormProps = {
  busy: boolean;
  onSubmit: (file: File) => void;
};

export function UploadForm({ busy, onSubmit }: UploadFormProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (file) onSubmit(file);
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-stone-300 bg-white p-4">
      <label htmlFor={inputId} className="block font-medium text-stone-900">
        Supplier document (PDF, up to {MAX_UPLOAD_MB} MB)
      </label>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        disabled={busy}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-stone-700 file:mr-3 file:rounded file:border-0 file:bg-stone-200 file:px-3 file:py-2 file:font-medium"
      />
      <button
        type="submit"
        disabled={!file || busy}
        className="w-full rounded bg-stone-900 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400 sm:w-auto"
      >
        {busy ? "Reading…" : "Read document"}
      </button>
    </form>
  );
}
