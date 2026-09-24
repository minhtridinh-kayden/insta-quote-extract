import { Check, TriangleAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { pageChip } from "@/lib/client";
import type { ExtractionResult, PageSummary } from "@/lib/schema";

const STATUS = {
  ok: { variant: "outline", Icon: Check },
  needs_review: { variant: "warning", Icon: TriangleAlert },
  refused: { variant: "destructive", Icon: X },
} as const satisfies Record<PageSummary["status"], unknown>;

export function PageStrip({ result }: { result: ExtractionResult }) {
  return (
    <nav aria-label="Pages in this file">
      <ul className="flex flex-wrap gap-2">
        {result.pages.map((page) => {
          const chip = pageChip(page, result.refusals);
          const { variant, Icon } = STATUS[chip.status];
          return (
            <li key={page.page}>
              <Badge variant={variant} className="h-auto min-h-7 whitespace-normal px-3 py-1 text-left text-sm">
                <Icon aria-hidden="true" />
                {chip.label}
              </Badge>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
