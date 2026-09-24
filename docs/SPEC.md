# Spec

## 1. Pipeline

```
bytes ──► pdf.ts ──► pages[]: { page, runs[], error? }
                         │  per page, isolated (try/catch)
                         ▼
                     rows.ts ──► rows[] (runs grouped by y), pageText
                         ▼
               section.ts (page subtitle → section)
                         ▼
          layout.ts (find header row → columns) ── not found ──► UNRECOGNISED_LAYOUT (page)
                         ▼
                     table.ts ──► candidate lines (cells by column)
                         ▼
                   numbers.ts ──► Evidenced fields / field refusals
                         ▼
                     notes.ts ──► printed totals, count-noun mentions
                         ▼
                   validate.ts ──► cross-check refusals (arithmetic, totals, conflicts)
                         ▼
                   pipeline.ts ──► ExtractionResult (+ invariant guard)
```

### Text runs and rows (verified on the fixtures)

- All text-layer fixtures are ReportLab output. **Each table cell is exactly one text run**, left-aligned at the x of its column header. Rows share an identical y.
- `rows.ts`: group runs whose y differs by ≤ 2pt; sort rows top-to-bottom (descending PDF y) and runs left-to-right.
- `pageText` = rows joined by `\n`; each row = its runs' `str` joined by a single space (trimmed).
- `sourceText` for any value = the full row string it sits on. So `sourceText` is always a line of `pageText`, and `raw` is always a substring of `sourceText`.
- `bbox` = `[x, y, width, height]` of the run in PDF points (origin bottom-left) for the cell. This is optional in the UI but cheap to keep.

### Header and columns (`layout.ts`)

- The header row is the first row containing runs `Item`, `Description` and `Qty` (case-insensitive, exact run text).
- Columns come from the header runs present: `Item`, `Description`, `Qty`, `Unit`, `Unit Price`, `Line Total`, plus any **unknown** header (e.g. `Weight` in KBS-10255) which becomes an `extra` column.
- Column x-range: from `header.x - 4` to the next header's `x - 4` (last column: to page width). Assign each run to the column whose range contains `run.x`.
- **Do not hard-code x positions**: KBS-10255 has `Qty` at x=311.8 and `Unit Price` at x=467.7, while other files have 326.0 and 428.0.
- The row of dashes directly under the header is ignored.
- Table body = consecutive rows after the header whose `Item` cell is a positive integer. The first row that doesn't match ends the table.
- No header found on a page that has text → page refusal `UNRECOGNISED_LAYOUT`. Fail closed.

### Section (`section.ts`)

The page subtitle is the row directly under the company name (row index 1). Classify by keywords, checking in this order:

| Keyword (case-insensitive) | section |
|---|---|
| `summary` | `summary` |
| `return` | `returns` |
| `credit` | `credit` |
| `acceptance` | `acceptance` |
| `site \d+ of \d+` | `delivery` |
| `packing list` | `packing_list` |
| otherwise | `unknown` |

Order matters: the DR118 summary subtitle is `Multi-Site Delivery Run 118 - Summary - Batch Delivery Run 118`.

Lines on `summary | returns | credit | acceptance` pages **are extracted** (with evidence and `section`), and the page gets one `NON_DELIVERY_SECTION` refusal. Its message explains that these quantities were not treated as delivered items because the page doesn't say whether they are returns, credits or a repeat of the deliveries.

### Notes (`notes.ts`)

Rows outside the table on the same page:

- **Printed totals**: a row whose first run is `Total:` followed by a money run on the same row (KBS-10234, 10270), or a single run matching `^Total:\s*(\$[\d,]+\.\d{2})$` (KBS-10262, which appears *after* the driver notes). Output as `documentTotals: Evidenced<number>[]`.
  - A row like `Total consignment weight: see individual lines.` is **not** a total; there is no number.
- **Count-noun mentions**: regex `\b(\d{1,3}(?:,\d{3})*|\d+)\s+(pallets?|bags?|boxes?|rolls?|bundles?|crates?|packs?|sheets?|cartons?)\b` over note rows. Group by the singular noun. If one noun has ≥ 2 different values on the same document → `CONFLICTING_VALUES` (document scope) with **every** mention as a candidate with its own evidence. Known limitation: the noun list is fixed (log it in DECISIONS).

## 2. Number parsing (`numbers.ts`)

All parsers take the raw cell string and return either `{ ok: true, value, raw, basis? }` or `{ ok: false, code, detail }`.

| Field | Accept | Result |
|---|---|---|
| Money | `^\$(\d{1,3}(,\d{3})+|\d+)\.\d{2}$` | value, cents internally |
| Money with basis | money followed by `\s*/\s*([a-z]+)$` e.g. `$68.00 /bag` | value + `priceBasis: "bag"` (evidenced, same raw) |
| Quantity | `^\d+$` or `^\d{1,3}(,\d{3})+$` | integer |
| Quantity | `^\d+\.\d+$` (not matching the ambiguous case below) | decimal |
| Ambiguous | `^\d{1,3}\.\d{3}$` (e.g. `1.250`: 1250 or 1.25?) | `AMBIGUOUS_NUMBER_FORMAT` |
| Missing | empty cell, `TBC`, `N/A`, `-`, `—`, `see attached` | `MISSING_VALUE` |
| Anything else | e.g. `12m2`, `approx 20` | `AMBIGUOUS_NUMBER_FORMAT` (keep raw in the refusal) |

Measurements in the `extra` weight column (`25kg`, `480g total`, `1.2kg`, `650g`):

- `^\d+(\.\d+)?\s*(kg|g)\s+total$` → evidenced, `basis: "total"`.
- `^\d+(\.\d+)?\s*(kg|g)$` → **no basis stated** → keep `raw` in `extra`, and add field refusal `AMBIGUOUS_UNIT_BASIS`: it isn't stated whether this is per item or for the whole line.
- Do not convert units and do not sum weights.

## 3. Cross-checks (`validate.ts`)

All arithmetic is done in integer cents and **never emitted**.

- **Line arithmetic**: if qty, unitPrice and lineTotal are all evidenced and `qty × unitPriceCents ≠ lineTotalCents` → line-scope `LINE_ARITHMETIC_MISMATCH` with the three evidenced values as candidates. Keep the line and all its fields (the document printed them), but flag them. No fixture triggers this; it's covered by a unit test.
- **Total vs lines**: for each page with a printed total and ≥ 1 line where every line has an evidenced lineTotal: if sum ≠ printed total → document-scope `TOTAL_MISMATCH`, with the printed total as the candidate. The message must **not** contain the computed sum or the difference.
- If any line's lineTotal is missing, skip the total check and don't refuse because of it (the missing value is already its own refusal).
- **Conflicting mentions**: see notes.ts.

## 4. Data contract (`src/lib/schema.ts`, zod)

```ts
type Evidence = {
  page: number;                 // 1-based physical page
  sourceText: string;           // full visual row, a line of pageText
  bbox?: [number, number, number, number];
};

type Evidenced<T> = {
  value: T;
  raw: string;                  // exact characters from the PDF run
  evidence: Evidence;
  source: "document";           // reserved: "user" for values a person confirms in the UI (stretch)
};

type Section = "packing_list" | "delivery" | "summary" | "returns" | "credit" | "acceptance" | "unknown";

type LineItem = {
  id: string;                   // "p3-l2"
  page: number;
  section: Section;
  itemNo?: Evidenced<number>;
  description: Evidenced<string>;
  quantity?: Evidenced<number>;
  unit?: Evidenced<string>;
  unitPrice?: Evidenced<number>;
  priceBasis?: Evidenced<string>;           // "bag" from "$68.00 /bag"
  lineTotal?: Evidenced<number>;
  extra: Record<string, Evidenced<string>>; // unknown columns, raw only (e.g. Weight)
  refusalIds: string[];                     // refusals that concern this line
};

type RefusalScope = "document" | "page" | "line" | "field";

type RefusalCode =
  // document
  | "NOT_A_PDF" | "ENCRYPTED" | "EMPTY_DOCUMENT" | "FILE_TOO_LARGE"
  // page
  | "NO_TEXT_LAYER" | "PAGE_PARSE_FAILED" | "UNRECOGNISED_LAYOUT" | "NON_DELIVERY_SECTION"
  | "COLUMN_NOT_PRESENT"        // e.g. no Line Total / no Unit column on this page
  // field
  | "MISSING_VALUE" | "AMBIGUOUS_NUMBER_FORMAT" | "AMBIGUOUS_UNIT_BASIS"
  // cross-check
  | "LINE_ARITHMETIC_MISMATCH" | "TOTAL_MISMATCH" | "CONFLICTING_VALUES"
  // guard (should never fire; means a bug was caught)
  | "VALUE_NOT_IN_SOURCE";

type Refusal = {
  id: string;
  code: RefusalCode;
  scope: RefusalScope;
  page?: number;
  lineId?: string;
  field?: string;               // "lineTotal", "extra.Weight", …
  raw?: string;                 // what was printed, if anything
  sourceText?: string;
  candidates?: Evidenced<number | string>[];   // conflicts: ALL values, none chosen
  userMessage: string;          // plain English, for a tradie
  suggestedAction?: string;     // what to do next
  technicalDetail: string;      // for developers; never shown as the main message
};

type PageSummary = {
  page: number;
  status: "ok" | "needs_review" | "refused";
  section?: Evidenced<Section> | { value: Section; raw: null };
  lineCount: number;
};

type ExtractionResult = {
  requestId: string;
  fileName: string;
  pageCount: number;
  status: "complete" | "needs_review" | "nothing_extracted";
  pages: PageSummary[];
  lineItems: LineItem[];
  documentTotals: Evidenced<number>[];
  refusals: Refusal[];
};
```

- `status`: `complete` = lines > 0 and no refusals; `needs_review` = lines > 0 and ≥ 1 refusal; `nothing_extracted` = 0 lines.
- **Column not present**: if the header has no `Line Total` (or no `Unit`) column, emit **one** page-scope `COLUMN_NOT_PRESENT` per missing column instead of one refusal per line. This avoids noise and is clearer to a user ("This packing list has no Line Total column, so no line totals are shown.").
- **Invariant guard** (`pipeline.ts`, last step): walk every `Evidenced` in the result. If `raw` is not in `sourceText`, or `sourceText` is not a line of that page's `pageText`, drop the value and add `VALUE_NOT_IN_SOURCE`. This should never fire; a test asserts it doesn't on any fixture.

## 5. HTTP (`/api/extract`)

- `POST`, `multipart/form-data`, field `file`. `export const runtime = "nodejs"`.
- Max size **4 MB** (Vercel's serverless request body limit is ~4.5 MB).

| Case | Status | Body |
|---|---|---|
| Processed (any mix of lines/refusals, including 0 lines) | **200** | `ExtractionResult` |
| No file field | 400 | `{ error: { code: "NO_FILE", userMessage, requestId } }` |
| Too large | 413 | `{ refusal: Refusal(FILE_TOO_LARGE), requestId }` |
| Not a PDF (magic bytes `%PDF-`, not just the extension), encrypted, 0 pages | 422 | `{ refusal: Refusal, requestId }` |
| Unexpected exception | 500 | `{ error: { code: "INTERNAL", userMessage, requestId } }`: honest message + requestId, no stack |

Log every request with `requestId`, status, page count, and refusal codes.

## 6. Part B UI

State machine in `page.tsx`. Use a single discriminated union and no shared `error: string`:

```
idle → uploading → processing →
   result        (200: complete | needs_review | nothing_extracted)
   rejected      (413/422: show refusal.userMessage + suggestedAction)
   badRequest    (400)
   serverError   (500: honest message + requestId)
   networkError  (fetch threw: "Couldn't reach the server. Check your connection and try again.")
   invalidResponse (zod parse failed: "The server sent a response we couldn't understand" + requestId if present)
```

Result screen, top to bottom:

1. **Summary banner** in plain words, e.g. "We read 9 items from 3 of 4 delivery pages. 5 things need your attention." For `nothing_extracted`, say what happened ("This file is a scanned image, so there was no text for us to read. Nothing was extracted."). **Never** show "No items found" or a generic error.
2. **Page strip**: one chip per page showing section + status (e.g. `p4 ⚠ scanned`, `p6 Returns note`).
3. **Needs your attention**: all refusals, expanded (not hidden in an accordion), sorted by scope (document → page → line/field). Each one shows the message, where it is ("Page 1: "Driver notes: 16 pallets unloaded at site…""), candidates side by side with their sources, and the suggested action.
4. **Line items**, grouped by page/section. Every number can be clicked or focused to show page + `sourceText` with the `raw` token highlighted. Missing fields show "Not on document", never blank and never `$0.00`.

Stretch (only if Part A and tests are green by ~3:45): "Resolve" actions on refusals (choose 14 or 16, type a missing value). Values chosen this way are stored with `source: "user"`, kept visually distinct, and never written back as document values.

## 7. User message style

- Say what happened, where, what it means for their quote, and what to do.
- No codes, no "error", no "invalid".
- Examples:
  - NO_TEXT_LAYER: "Page 4 is a scanned image, so we couldn't read any text on it. Nothing from page 4 is included. Upload the original digital PDF, or enter those items by hand."
  - TOTAL_MISMATCH: "The items listed don't add up to the Total printed on the page ($1,612.90). The note says freight may be included, but no freight amount is shown. We haven't guessed which figure is right. Check with the supplier before using this total in a quote."
  - CONFLICTING_VALUES: "The number of pallets doesn't match: 14 at the depot, 16 at the site. We haven't picked one. Check which is correct."
  - NON_DELIVERY_SECTION: "Page 6 is a Returns Note. It lists items, but doesn't say whether they were returned, credited or delivered, so we've kept them separate from the delivered items."
