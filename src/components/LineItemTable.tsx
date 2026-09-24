import { fieldRefusals, groupLinesByPage, SECTION_LABELS, type FieldRefusals, type LineGroup } from "@/lib/client";
import { EXTRA_FIELD_PREFIX, type ExtractionResult } from "@/lib/schema";
import { LineValue } from "./LineValue";

const HEADER = "px-2 py-2 text-left text-sm font-semibold text-stone-600";
const CELL = "px-2 py-2 align-top";

function LineGroupTable({ group, refusalFor }: { group: LineGroup; refusalFor: FieldRefusals }) {
  return (
    <section aria-labelledby={`lines-p${group.page}`} className="space-y-2">
      <h3 id={`lines-p${group.page}`} className="font-semibold">
        Page {group.page} · {SECTION_LABELS[group.section]}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-stone-300 bg-white">
        <table className="min-w-full divide-y divide-stone-200">
          <thead>
            <tr>
              <th className={HEADER}>Item</th>
              <th className={HEADER}>Description</th>
              <th className={HEADER}>Qty</th>
              <th className={HEADER}>Unit</th>
              <th className={HEADER}>Unit price</th>
              <th className={HEADER}>Line total</th>
              {group.extraHeadings.map((heading) => (
                <th key={heading} className={HEADER}>
                  {heading}
                </th>
              ))}
              <th className={HEADER}>Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {group.lines.map((line) => (
              <tr key={line.id}>
                <td className={CELL}><LineValue value={line.itemNo} refusal={refusalFor(line, "itemNo")} /></td>
                <td className={`${CELL} min-w-48`}><LineValue value={line.description} refusal={refusalFor(line, "description")} /></td>
                <td className={CELL}><LineValue value={line.quantity} refusal={refusalFor(line, "quantity")} /></td>
                <td className={CELL}><LineValue value={line.unit} refusal={refusalFor(line, "unit")} /></td>
                <td className={CELL}><LineValue value={line.unitPrice} refusal={refusalFor(line, "unitPrice")} /></td>
                <td className={CELL}><LineValue value={line.lineTotal} refusal={refusalFor(line, "lineTotal")} /></td>
                {group.extraHeadings.map((heading) => (
                  <td key={heading} className={CELL}><LineValue value={line.extra[heading]} refusal={refusalFor(line, `${EXTRA_FIELD_PREFIX}${heading}`)} /></td>
                ))}
                <td className={CELL}>
                  {line.refusalIds.map((id, i) => (
                    <a key={id} href={`#${id}`} className="block text-sm text-amber-800 underline">
                      See note{line.refusalIds.length > 1 ? ` ${i + 1}` : ""}
                    </a>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LineItemTable({ result }: { result: ExtractionResult }) {
  const groups = groupLinesByPage(result);
  const refusalFor = fieldRefusals(result.refusals);
  if (groups.length === 0) return null;
  return (
    <section aria-labelledby="lines-heading" className="space-y-4">
      <h2 id="lines-heading" className="text-lg font-semibold">
        Line items, as printed
      </h2>
      <p className="text-sm text-stone-600">Tap any value to see the line on the page it came from.</p>
      {groups.map((group) => (
        <LineGroupTable key={group.page} group={group} refusalFor={refusalFor} />
      ))}
    </section>
  );
}
