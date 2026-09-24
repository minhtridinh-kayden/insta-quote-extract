import type { LineItem } from "@/lib/schema";

export function asExpected(line: LineItem) {
  return {
    id: line.id,
    section: line.section,
    description: line.description?.raw,
    ...(line.quantity && { quantity: line.quantity.raw }),
    ...(line.unit && { unit: line.unit.raw }),
    ...(line.unitPrice && { unitPrice: line.unitPrice.raw }),
    ...(line.priceBasis && { priceBasis: line.priceBasis.value }),
    ...(line.lineTotal && { lineTotal: line.lineTotal.raw }),
    ...(Object.keys(line.extra).length > 0 && {
      extra: Object.fromEntries(Object.entries(line.extra).map(([k, v]) => [k, v.raw])),
    }),
  };
}
