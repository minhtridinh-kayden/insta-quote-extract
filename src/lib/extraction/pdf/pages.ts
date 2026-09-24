import { toTextRuns } from "./text-runs";
import type { PageRead, PdfDocumentLike } from "./types";

async function readPage(doc: PdfDocumentLike, page: number): Promise<PageRead> {
  try {
    const content = await (await doc.getPage(page)).getTextContent();
    const runs = toTextRuns(content.items);
    return runs.length > 0 ? { page, kind: "text", runs } : { page, kind: "no_text" };
  } catch (error) {
    return { page, kind: "failed", detail: error instanceof Error ? error.message : String(error) };
  }
}

export async function readPages(doc: PdfDocumentLike): Promise<PageRead[]> {
  const pages: PageRead[] = [];
  for (let page = 1; page <= doc.numPages; page++) pages.push(await readPage(doc, page));
  return pages;
}
