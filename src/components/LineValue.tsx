import type { Evidenced, Refusal } from "@/lib/schema";
import { EvidenceValue } from "./EvidenceValue";
import { NotOnDocument } from "./NotOnDocument";

type LineValueProps = {
  value?: Evidenced<unknown>;
  refusal?: Refusal;
};

export function LineValue({ value, refusal }: LineValueProps) {
  if (value) return <EvidenceValue value={value} />;
  if (refusal) {
    return (
      <a href={`#${refusal.id}`} className="text-sm text-amber-800 underline">
        Can&apos;t read, see note
      </a>
    );
  }
  return <NotOnDocument />;
}
