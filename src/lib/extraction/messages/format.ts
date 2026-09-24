export function quote(text: string): string {
  return `"${text}"`;
}

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function onPage(page: number): string {
  return `on page ${page}`;
}
