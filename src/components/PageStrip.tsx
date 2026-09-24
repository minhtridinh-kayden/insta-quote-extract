import { pageAnchor, pageChip } from "@/lib/client";
import type { ExtractionResult } from "@/lib/schema";
import { PageStatusBadge } from "./PageStatusBadge";

export function PageStrip({ result }: { result: ExtractionResult }) {
  return (
    <nav aria-label="Pages in this file">
      <ul className="flex flex-wrap gap-2">
        {result.pages.map((page) => (
          <li key={page.page}>
            <PageStatusBadge chip={pageChip(page, result.refusals)} href={`#${pageAnchor(page.page)}`} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
