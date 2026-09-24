import { Check, TriangleAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PageChip } from "@/lib/client";
import type { PageSummary } from "@/lib/schema";

const STATUS = {
  ok: { variant: "success", Icon: Check },
  needs_review: { variant: "warning", Icon: TriangleAlert },
  refused: { variant: "destructive", Icon: X },
} as const satisfies Record<PageSummary["status"], unknown>;

type PageStatusBadgeProps = {
  chip: PageChip;
  href?: string;
  statusOnly?: boolean;
};

export function PageStatusBadge({ chip, href, statusOnly = false }: PageStatusBadgeProps) {
  const { variant, Icon } = STATUS[chip.status];
  const content = (
    <>
      <Icon aria-hidden="true" />
      {statusOnly ? chip.statusText : chip.label}
    </>
  );
  const className = "h-auto min-h-7 whitespace-normal px-3 py-1 text-left text-sm";
  if (!href) {
    return (
      <Badge variant={variant} className={className}>
        {content}
      </Badge>
    );
  }
  return (
    <Badge asChild variant={variant} className={`${className} hover:underline`}>
      <a href={href}>{content}</a>
    </Badge>
  );
}
