export const NETWORK_MESSAGE = "Couldn't reach the server. Check your connection and try again.";

export function invalidResponseMessage(requestId?: string): string {
  const reference = requestId ? ` If it happens again, give us this reference: ${requestId}.` : "";
  return `The server sent a response we couldn't understand, so we can't show a result for this file. Please try again.${reference}`;
}
