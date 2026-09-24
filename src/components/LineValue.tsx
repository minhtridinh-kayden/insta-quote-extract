import type { Evidenced, Refusal } from "@/lib/schema";
import { EvidenceValue } from "./EvidenceValue";
import { NotOnDocument } from "./NotOnDocument";

type LineValueProps = {
  value?: Evidenced<unknown>;
  refusal?: Refusal;
};

export function LineValue({ value, refusal }: LineValueProps) {
  if (value) return <EvidenceValue value={value} />;
  if (refusal) return <span className="text-sm font-medium text-warning-foreground">Can&apos;t read</span>;
  return <NotOnDocument />;
}
