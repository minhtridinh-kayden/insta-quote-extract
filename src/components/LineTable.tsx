import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FieldRefusals, PageView } from "@/lib/client";
import { EXTRA_FIELD_PREFIX } from "@/lib/schema";
import { CompactNote } from "./CompactNote";
import { LineValue } from "./LineValue";

const COLUMNS = [
  ["itemNo", "Item"],
  ["description", "Description"],
  ["quantity", "Qty"],
  ["unit", "Unit"],
  ["unitPrice", "Unit price"],
  ["lineTotal", "Line total"],
] as const;

type LineTableProps = {
  view: PageView;
  refusalFor: FieldRefusals;
};

export function LineTable({ view, refusalFor }: LineTableProps) {
  const columnCount = COLUMNS.length + view.extraHeadings.length;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map(([, heading]) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
          {view.extraHeadings.map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {view.lines.map((line) => {
          const notes = view.lineNotes.get(line.id) ?? [];
          const flagged = notes.length > 0 ? "bg-warning/10 hover:bg-warning/15" : "";
          return (
            <Fragment key={line.id}>
              <TableRow data-line-id={line.id} className={`${flagged} ${notes.length > 0 ? "border-b-0" : ""}`}>
                {COLUMNS.map(([field]) => (
                  <TableCell key={field} className={`align-top ${field === "description" ? "min-w-48 whitespace-normal" : ""}`}>
                    <LineValue value={line[field]} refusal={refusalFor(line, field)} />
                  </TableCell>
                ))}
                {view.extraHeadings.map((heading) => (
                  <TableCell key={heading} className="align-top">
                    <LineValue value={line.extra[heading]} refusal={refusalFor(line, `${EXTRA_FIELD_PREFIX}${heading}`)} />
                  </TableCell>
                ))}
              </TableRow>
              {notes.length > 0 && (
                <TableRow data-notes-for={line.id} className={flagged}>
                  <TableCell colSpan={columnCount} className="whitespace-normal pt-0">
                    <div className="sticky left-3 w-[min(40rem,calc(100vw-4rem))] space-y-1.5 border-l-2 border-warning pl-3">
                      {notes.map((note) => (
                        <CompactNote key={note.id} refusal={note} />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
