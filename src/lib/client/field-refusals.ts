import type { FieldPath, LineItem, Refusal } from "@/lib/schema";

export type FieldRefusals = (line: LineItem, field: FieldPath) => Refusal | undefined;

export function fieldRefusals(refusals: Refusal[]): FieldRefusals {
  const byId = new Map(refusals.map((refusal) => [refusal.id, refusal]));
  return (line, field) => line.refusalIds.map((id) => byId.get(id)).find((refusal) => refusal?.field === field);
}
