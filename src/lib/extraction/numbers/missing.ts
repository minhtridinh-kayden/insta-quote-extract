const MISSING_TOKENS = new Set(["", "tbc", "n/a", "-", "—", "see attached"]);

export function isMissingToken(raw: string): boolean {
  return MISSING_TOKENS.has(raw.trim().toLowerCase());
}
