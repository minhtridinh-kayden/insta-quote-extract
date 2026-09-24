import { fieldRefusals, pageViews } from "@/lib/client";
import type { ExtractionResult } from "@/lib/schema";
import { PageSection } from "./PageSection";

export function PageSections({ result }: { result: ExtractionResult }) {
  const refusalFor = fieldRefusals(result.refusals);
  return (
    <section aria-labelledby="pages-heading" className="space-y-4">
      <div>
        <h2 id="pages-heading" className="text-lg font-semibold">
          Page by page, as printed
        </h2>
        <p className="text-sm text-muted-foreground">
          Each page shows its items and anything to check on it. Tap any value to see the line it came from.
        </p>
      </div>
      {pageViews(result).map((view) => (
        <PageSection key={view.page} view={view} refusalFor={refusalFor} />
      ))}
    </section>
  );
}
