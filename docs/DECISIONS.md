# Decision log

Short entries: decision, why, cost. Append as you go. The README's "hardest decision", "not confident" and "three more days" sections come from here.

## D1. Deterministic coordinate-based parsing, no LLM in the extraction path

- **Decision:** Extract tables from the PDF text layer using run coordinates: header text → column x-ranges → cells. No LLM.
- **Why:** The hard rule is "never output a number you can't point to". Here every cell is a separate text run with a position, so provenance (page, exact row text, bbox) falls out of the parser for free and is exact. An LLM would add a hallucination path that then needs a verifier to police it, plus nondeterministic tests, an API key for reviewers, and latency/cost per page (DR118 has 8 pages).
- **Cost:** Brittle on layouts unlike these fixtures. Mitigation: fail closed with `UNRECOGNISED_LAYOUT` rather than guess. Future work: an LLM that *proposes* rows for unknown layouts, with every value still verified against the text layer.

## D2. Refuse scanned pages instead of OCR

- **Decision:** A page with no text layer gets `NO_TEXT_LAYER`, and the other pages continue.
- **Why:** OCR text is itself a guess about the image. `8` vs `3` or `1` vs `7` errors would become confident numbers in a quote. Without a confidence model and a human confirmation step, OCR output doesn't meet "exact source text".
- **Cost:** KBS-10241 is perfectly legible to a human and yields nothing. This is the refusal I'm least comfortable with from a product point of view. Future work: OCR with per-token confidence, values shown as "read from image, please confirm", never merged silently.

## D3. No derived numbers in the output

- **Decision:** Arithmetic is for cross-checks only. Refusals cite printed values, never computed sums or differences.
- **Why:** A reviewer (or user) can't find 1,538.20 or 74.70 in KBS-10270. Emitting them breaks "every number traceable", even if they're arithmetically correct.
- **Cost:** Less helpful messages ("doesn't add up" instead of "is $74.70 short"). A future version could show derived values with an explicit "calculated from lines 1–4" label and per-input evidence.

## D4. Refuse at the smallest scope; one page-level refusal for a missing column

- **Decision:** Scopes are document > page > line > field. A column absent from the header (KBS-10255 Line Total, Unit) is one page-level `COLUMN_NOT_PRESENT`, not one refusal per line.
- **Why:** Keep everything provable (qty and price in KBS-10255 are fine) and keep the attention list readable for a non-technical user.

## D5. Don't infer the quantity unit from the price basis

- **Decision:** In KBS-10255, `$68.00 /bag` yields `priceBasis: "bag"` but no `unit` on the quantity.
- **Why:** "4" with a per-bag price is *probably* 4 bags, but the document doesn't say so, and weight `25kg` could mean one 25kg bag or 25kg in total.
- **Cost:** Possibly over-strict. Flagged in the README as a judgment call.

## D6. Non-delivery pages are extracted but kept separate

- **Decision:** DR118 pages 5–8 (Summary/Returns/Credit/Acceptance) keep their lines with `section` set and get one `NON_DELIVERY_SECTION` refusal each.
- **Why:** Their tables look like deliveries, but their meaning (returned? credited? repeated?) isn't stated, and the numbers aren't negative. Dropping them would hide data; merging them would double-count.
- **Cost:** Section detection is keyword-based on the subtitle.

## D7. Refusal ≠ error at the HTTP layer

- **Decision:** 200 for any processed document (even 0 lines); 413/422 carry a structured refusal; 500 only for real failures, with requestId. The client validates with the same zod schema.
- **Why:** This is the exact layer where a correct refusal becomes "something went wrong".

## D10. A line without a readable description is kept

- **Decision:** `LineItem.description` is optional (SPEC §4 has it required). A blank or `TBC` description gives a field-scope `MISSING_VALUE`, and the line keeps its other printed values.
- **Why:** Rule 4: one bad field must not discard the rest of its line. Requiring a description meant dropping good qty/price/total along with it.
- **Cost:** The UI must show "Not on document" for a missing description, like any other missing field.

## D11. Ambiguous tables fail closed

- **Decision:** A header that names the same column twice, or a header with no numbered item rows under it, is `UNRECOGNISED_LAYOUT`. The first column extends to the page's left edge so right-aligned item numbers aren't lost.
- **Why:** Two `Qty` columns means two printed values for one field; picking one is guessing. A header with nothing under it means the layout wasn't understood, and "0 items, no problems" would be a silent failure.

## Known limitations (fill in as found)

- Count-noun conflict detection uses a fixed noun list (pallets, bags, boxes, rolls, bundles, crates, packs, sheets, cartons).
- No detection of *missing* rows: the table ends at the first row whose Item cell isn't a plain positive integer (e.g. a wrapped description, `3a`, `1.`), and any item rows after it are not read and not refused. A coverage check (every numeric run on the page is either used or listed) would catch this.
- Column ranges start 4pt left of each heading, which fits left-aligned tables (all fixtures). A right-aligned amount wider than its heading would fall into the column to its left.
- GST and currency are never stated in the fixtures. Amounts are output as printed, with no NZD or ex/incl-GST labels.
- Only validated on one supplier's layout family (6 files).
- Section keywords match anywhere in the subtitle, so an address like "Site 2 of 4 - Credit St" would be read as a credit page. That fails safe (lines are kept but flagged as non-delivery). The subtitle is assumed to be row 1, directly under the company name.

## D8. Run text is trimmed; a damaged PDF is refused as NOT_A_PDF

- **Decision:** Each text run's `str` is trimmed and whitespace-only runs are dropped before rows are built. A file that starts with `%PDF-` but that pdf.js can't parse (`InvalidPDFException`) is refused as `NOT_A_PDF`, with the parser message in `technicalDetail`.
- **Why:** ReportLab emits `" "` spacer runs between cells. Trimming keeps `raw` ⊂ `sourceText` exact, since both come from the same trimmed strings. A damaged file is a problem with the upload, not our system, so it gets a refusal (422) rather than a 500.
- **Cost:** `raw` can differ from the PDF bytes by surrounding whitespace. The user message for a damaged PDF says "isn't a PDF file", which is slightly off; a separate `DAMAGED_PDF` code would be more precise.

## D9. A quantity like `0.500` is a decimal, not ambiguous

- **Decision:** `AMBIGUOUS_NUMBER_FORMAT` applies to `^[1-9]\d{0,2}\.\d{3}$` (e.g. `1.250`), not SPEC's `^\d{1,3}\.\d{3}$`.
- **Why:** A leading `0` can't be a thousands group, so `0.500` has only one reading. Refusing it would be over-refusal.
- **Cost:** None found. `1.250` and `12.500` are still refused.
