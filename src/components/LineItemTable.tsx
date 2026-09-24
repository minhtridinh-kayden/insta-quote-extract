import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fieldRefusals, groupLinesByPage, SECTION_LABELS, type FieldRefusals, type LineGroup } from "@/lib/client";
import { EXTRA_FIELD_PREFIX, type ExtractionResult } from "@/lib/schema";
import { LineValue } from "./LineValue";

const COLUMNS = [
  ["itemNo", "Item"],
  ["description", "Description"],
  ["quantity", "Qty"],
  ["unit", "Unit"],
  ["unitPrice", "Unit price"],
  ["lineTotal", "Line total"],
] as const;

function LineGroupTable({ group, refusalFor }: { group: LineGroup; refusalFor: FieldRefusals }) {
  return (
    <section aria-labelledby={`lines-p${group.page}`} className="space-y-2">
      <h3 id={`lines-p${group.page}`} className="font-semibold">
        Page {group.page} · {SECTION_LABELS[group.section]}
      </h3>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map(([, heading]) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
              {group.extraHeadings.map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
              <TableHead>Check</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.lines.map((line) => (
              <TableRow key={line.id}>
                {COLUMNS.map(([field]) => (
                  <TableCell key={field} className={`align-top ${field === "description" ? "min-w-48 whitespace-normal" : ""}`}>
                    <LineValue value={line[field]} refusal={refusalFor(line, field)} />
                  </TableCell>
                ))}
                {group.extraHeadings.map((heading) => (
                  <TableCell key={heading} className="align-top">
                    <LineValue value={line.extra[heading]} refusal={refusalFor(line, `${EXTRA_FIELD_PREFIX}${heading}`)} />
                  </TableCell>
                ))}
                <TableCell className="align-top">
                  {line.refusalIds.map((id, i) => (
                    <a key={id} href={`#${id}`} className="block text-sm text-warning-foreground underline underline-offset-4">
                      See note{line.refusalIds.length > 1 ? ` ${i + 1}` : ""}
                    </a>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

export function LineItemTable({ result }: { result: ExtractionResult }) {
  const groups = groupLinesByPage(result);
  if (groups.length === 0) return null;
  const refusalFor = fieldRefusals(result.refusals);
  return (
    <section aria-labelledby="lines-heading" className="space-y-4">
      <div>
        <h2 id="lines-heading" className="text-lg font-semibold">
          Line items, as printed
        </h2>
        <p className="text-sm text-muted-foreground">Tap any value to see the line on the page it came from.</p>
      </div>
      {groups.map((group) => (
        <LineGroupTable key={group.page} group={group} refusalFor={refusalFor} />
      ))}
    </section>
  );
}
