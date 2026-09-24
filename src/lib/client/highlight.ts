export type Highlighted = { before: string; match: string; after: string };

function wholeTokenPositions(text: string, token: string): number[] {
  const positions: number[] = [];
  for (let at = text.indexOf(token); at >= 0; at = text.indexOf(token, at + 1)) {
    const startsToken = at === 0 || text[at - 1] === " ";
    const endsToken = at + token.length === text.length || text[at + token.length] === " ";
    if (startsToken && endsToken) positions.push(at);
  }
  return positions;
}

export function highlight(sourceText: string, raw: string): Highlighted {
  const positions = raw ? wholeTokenPositions(sourceText, raw) : [];
  if (positions.length !== 1) return { before: sourceText, match: "", after: "" };
  const [at] = positions;
  return { before: sourceText.slice(0, at), match: raw, after: sourceText.slice(at + raw.length) };
}
