import { getDocumentProxy } from "unpdf";
import type { DocumentFailure, PdfDocumentLike } from "./types";

export type LoadResult = { ok: true; doc: PdfDocumentLike } | { ok: false; failure: DocumentFailure };

export function classifyLoadError(error: unknown): DocumentFailure | null {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);
  if (name === "PasswordException") return { code: "ENCRYPTED", detail: `${name}: ${message}` };
  if (name === "InvalidPDFException") return { code: "NOT_A_PDF", detail: `${name}: ${message}` };
  return null;
}

export async function loadPdf(bytes: Uint8Array): Promise<LoadResult> {
  try {
    // pdf.js detaches the buffer it is given, so it gets a copy.
    const doc = await getDocumentProxy(bytes.slice(), { verbosity: 0 });
    return { ok: true, doc };
  } catch (error) {
    const failure = classifyLoadError(error);
    if (!failure) throw error;
    return { ok: false, failure };
  }
}
