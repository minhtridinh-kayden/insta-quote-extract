export const NO_FILE_MESSAGE = "We didn't receive a file. Choose a PDF and try again.";

export function internalMessage(requestId: string): string {
  return `We couldn't finish reading this file because of a problem on our side, not with your document. Please try again. If it happens again, give us this reference: ${requestId}.`;
}
