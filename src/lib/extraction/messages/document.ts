import { quote } from "./format";
import type { MessageBuilders } from "./types";

export const documentMessages: MessageBuilders<
  "NOT_A_PDF" | "ENCRYPTED" | "EMPTY_DOCUMENT" | "FILE_TOO_LARGE"
> = {
  NOT_A_PDF: ({ fileName }) => ({
    userMessage: `${quote(fileName)} isn't a PDF file, so we couldn't read it.`,
    suggestedAction: "Upload the original PDF you got from the supplier.",
  }),
  ENCRYPTED: () => ({
    userMessage: "This PDF is password-protected, so we couldn't open it.",
    suggestedAction: "Ask the supplier for a copy without a password, then upload it again.",
  }),
  EMPTY_DOCUMENT: () => ({
    userMessage: "This PDF has no pages, so there was nothing to read.",
    suggestedAction: "Check you picked the right file and upload it again.",
  }),
  FILE_TOO_LARGE: ({ maxMb }) => ({
    userMessage: `This file is bigger than the ${maxMb} MB we can accept, so we didn't read it.`,
    suggestedAction: "Upload a smaller copy, or split the document into separate files.",
  }),
};
