export type TextRun = {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PageRead =
  | { page: number; kind: "text"; runs: TextRun[] }
  | { page: number; kind: "no_text" }
  | { page: number; kind: "failed"; detail: string };

export type DocumentFailure = {
  code: "NOT_A_PDF" | "ENCRYPTED" | "EMPTY_DOCUMENT";
  detail: string;
};

export type PdfReadResult =
  | { ok: true; pages: PageRead[] }
  | { ok: false; failure: DocumentFailure };

export type PdfPageLike = {
  getTextContent(): Promise<{ items: unknown[] }>;
};

export type PdfDocumentLike = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageLike>;
};
