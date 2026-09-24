import { loadPdf } from "./load";
import { readPages } from "./pages";
import { hasPdfSignature } from "./signature";
import type { PdfDocumentLike, PdfReadResult } from "./types";

export async function readDocument(doc: PdfDocumentLike): Promise<PdfReadResult> {
  if (doc.numPages === 0) {
    return { ok: false, failure: { code: "EMPTY_DOCUMENT", detail: "numPages is 0" } };
  }
  return { ok: true, pages: await readPages(doc) };
}

export async function readPdf(bytes: Uint8Array): Promise<PdfReadResult> {
  if (!hasPdfSignature(bytes)) {
    return { ok: false, failure: { code: "NOT_A_PDF", detail: "missing %PDF- signature" } };
  }
  const loaded = await loadPdf(bytes);
  if (!loaded.ok) return loaded;
  return readDocument(loaded.doc);
}

export type { DocumentFailure, PageRead, PdfDocumentLike, PdfReadResult, TextRun } from "./types";
