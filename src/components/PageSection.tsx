import { Card, CardContent } from "@/components/ui/card";
import { pageAnchor, type FieldRefusals, type PageView } from "@/lib/client";
import { CompactNote } from "./CompactNote";
import { LineTable } from "./LineTable";
import { PageStatusBadge } from "./PageStatusBadge";

type PageSectionProps = {
  view: PageView;
  refusalFor: FieldRefusals;
};

export function PageSection({ view, refusalFor }: PageSectionProps) {
  const headingId = `${pageAnchor(view.page)}-heading`;
  return (
    <section id={pageAnchor(view.page)} aria-labelledby={headingId} className="scroll-mt-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={headingId} className="font-semibold">
          Page {view.page}
          {view.sectionLabel && ` · ${view.sectionLabel}`}
        </h3>
        <PageStatusBadge chip={view.chip} statusOnly />
      </div>
      <Card className={`gap-0 py-0 ${view.chip.status === "ok" ? "" : "ring-warning/50"}`}>
        {view.pageNotes.length > 0 && (
          <CardContent className="space-y-2 border-b bg-warning/5 py-3">
            {view.pageNotes.map((note) => (
              <CompactNote key={note.id} refusal={note} />
            ))}
          </CardContent>
        )}
        {view.lines.length > 0 ? (
          <LineTable view={view} refusalFor={refusalFor} />
        ) : (
          <CardContent className="py-3 text-sm text-muted-foreground">No line items were read from this page.</CardContent>
        )}
      </Card>
    </section>
  );
}
