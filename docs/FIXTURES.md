# Fixtures: what each sample contains

Six PDFs in `fixtures/pdfs/`, all from the fictional supplier "Kowhai Building Supplies Ltd". Text-layer PDFs are ReportLab output: one text run per table cell, and cells are left-aligned at their column header's x. Checked:

- No encrypted files.
- No hidden or invisible text. The scanned pages contain only an image XObject plus an empty `BT…ET`.
- Arithmetic was recomputed by hand.

Each file maps to one evaluation criterion.

| File | Pages | Trap | Criterion tested | Expected status |
|---|---|---|---|---|
| KBS-10234 | 1 | None. Clean control file | Don't over-refuse | `complete` |
| KBS-10241 | 1 | Whole file is a scanned image (no text layer) | A 0-item result still reaches the user as a clear explanation | `nothing_extracted` |
| KBS-10255 | 1 | Different columns: no Unit, no Line Total, extra `Weight` column with mixed per-item/total semantics; price has a basis suffix | Don't compute or infer missing values | `needs_review` |
| KBS-10262 | 1 | Notes contradict: 14 pallets loaded vs 16 unloaded | Surface contradictions without picking one | `needs_review` |
| KBS-10270 | 1 | Lines sum to less than the printed Total; note says "Freight and handling included where applicable" | Don't invent a freight line to explain the gap | `needs_review` |
| KBS-DR118 | 8 | Page 4 is scanned; pages 5–8 are Summary / Returns / Credit / Acceptance with tables identical to delivery pages | Containment of partial failure; don't treat non-delivery pages as deliveries | `needs_review` |

---

## KBS-10234: clean control

```
Item  Description                               Qty  Unit   Unit Price  Line Total
1     10mm GIB Standard board 2400x1200         48   sheet  $24.90      $1,195.20
2     13mm GIB Fyreline board 2700x1200         12   sheet  $38.50      $462.00
3     Stud adhesive 400ml cartridge             36   ea     $9.80       $352.80
4     GIB Rondo top hat batten 3.6m             20   ea     $14.20      $284.00
5     Plasterboard screws 32mm (box of 1000)    8    box    $42.00      $336.00
                                          Total:                        $2,630.00
All items checked against delivery docket on arrival. No damage noted.
```

- Every line satisfies qty × price = total, and the lines sum to $2,630.00. **Expect zero refusals.**
- `Total:` (x=337.3) and `$2,630.00` (x=501.7) are separate runs on the same row, below the table.
- Descriptions contain digits (`2400x1200`, `400ml`, `3.6m`, `(box of 1000)`). These are part of the description string and must **not** be parsed as quantities, and must not trigger the count-noun rule (`1000)` is not followed by a count noun).
- Header x: Item 42.5, Description 70.9, Qty 326.0, Unit 377.0, Unit Price 428.0, Line Total 501.7.

## KBS-10241: scanned, whole file

- 1 page, a single 1654×2339 image at 200 dpi, no text runs (pdftotext returns only a form feed).
- To a human the image is clean and its arithmetic is consistent. **That is the point**: we still can't cite source text, so we refuse (`NO_TEXT_LAYER`, page 1) and return HTTP 200 with `nothing_extracted`.
- UI must explain it's a scan and what to do. It must not show "No items found" or an error.
- The trade-off (a human could read it; OCR could) goes in the README. See DECISIONS D2.

## KBS-10255: different columns, ambiguous weights

```
Item  Description                  Qty   Weight       Unit Price
1     Galv nails 90mm, bulk        4     25kg         $68.00 /bag
2     Roofing screws, loose        1200  480g total   $0.09 /ea
3     Construction adhesive tubs   6     1.2kg        $11.50 /ea
4     Packing shims, bundle        3     650g         $4.20 /bundle
Total consignment weight: see individual lines.
Note: weight figures as recorded by depot staff at dispatch.
```

- Header x differs: Qty **311.8**, Weight 377.0, Unit Price **467.7**. Columns must come from the header.
- No `Unit` column, no `Line Total` column, no printed total.
- Expected:
  - Lines: 4, each with description, quantity, unitPrice, and priceBasis (`bag`, `ea`, `ea`, `bundle`).
  - `COLUMN_NOT_PRESENT` ×2 (page 1): `Line Total` and `Unit`. **Do not compute** 4×68=272, 1200×0.09=108, 6×11.50=69, 3×4.20=12.60.
  - Do **not** set `unit: "bag"` from the price suffix. The quantity's unit isn't stated; `priceBasis` is what the document actually says.
  - Weight goes into `extra.Weight` as raw. Line 2 `480g total` is explicit. Lines 1, 3 and 4 (`25kg`, `1.2kg`, `650g`) → `AMBIGUOUS_UNIT_BASIS` ×3 (field), because it isn't stated whether the weight is per item or for the line.
  - "Total consignment weight: see individual lines." is not a total. Don't sum weights.

## KBS-10262: contradictory notes

```
Summary: 14 pallets loaded at depot, all strapped and wrapped.      (above the table)
1  10mm GIB Standard board 2400x1200  96  sheet   $24.90   $2,390.40
2  H3.2 framing 90x45 4.8m            80  length  $18.40   $1,472.00
3  Roof underlay roll 1.5x50m         6   roll    $210.00  $1,260.00
Driver notes: 16 pallets unloaded at site, all accounted for on the day.
Total: $5,122.40                                                    (single run, after the notes)
```

- Lines and total are all consistent.
- Header row is at a different y (654.8 vs 666.1) because of the Summary line. Don't hard-code y either.
- `CONFLICTING_VALUES` (document): candidates `14 pallets` and `16 pallets`, each with its own sourceText. No other refusals.
- `Total: $5,122.40` is one run → matched by the single-run total pattern.

## KBS-10270: total doesn't match lines

```
1  13mm GIB Aqualine board 2400x1200  30  sheet  $31.20   $936.00
2  Bathroom sealant, tube             18  ea     $8.90    $160.20
3  Corner trim, 3m length             10  ea     $6.40    $64.00
4  Wet area membrane roll             2   roll   $189.00  $378.00
                                                   Total: $1,612.90
Freight and handling included where applicable.
```

- Each line's arithmetic is correct. The lines sum to 1,538.20, and the printed Total is $1,612.90 (a gap of 74.70).
- Expected: 4 lines, `documentTotals: [$1,612.90]`, one `TOTAL_MISMATCH` (document).
- **Forbidden anywhere in the JSON (values or messages)**: `1,538.20`, `1538.2`, `74.70`, `74.7`. No synthetic "freight" line.

## KBS-DR118: multi-page run, one scanned page, non-delivery pages

| Page | Subtitle | Section | Text layer | Lines |
|---|---|---|---|---|
| 1 | Site 1 of 4 - Ranfurly Ave | delivery | yes | lot 1-1..1-3 |
| 2 | Site 2 of 4 - Ranfurly Ave | delivery | yes | lot 2-1..2-3 |
| 3 | Site 3 of 4 - Beach Road | delivery | yes | lot 3-1..3-3 |
| 4 | Site 4 of 4 - Beach Road | (unreadable) | **no (scan)** | nothing |
| 5 | Summary - Batch Delivery Run 118 | summary | yes | lot 5-1..5-3 |
| 6 | Returns Note | returns | yes | lot 6-1..6-3 |
| 7 | Credit Adjustment | credit | yes | lot 7-1..7-3 |
| 8 | Signed Acceptance | acceptance | yes | lot 8-1..8-3 |

- Every table has the same structure: qty 10/13/16 `length`, $16/$17/$18, totals $160/$221/$288. All consistent. No printed totals.
- Item numbers restart at 1 on every page, so IDs must include the page.
- Expected:
  - 21 lines total (3 × 7 readable pages): 9 `delivery`, and 3 each for `summary`, `returns`, `credit`, `acceptance`.
  - `NO_TEXT_LAYER` on page 4. The message should note it's "Site 4 of 4" only if we can know that, and we can't (it's in the image). So just say page 4.
  - `NON_DELIVERY_SECTION` on pages 5, 6, 7 and 8.
- The summary page lists "lot 5-x" rather than totals of sites 1–4, so it doesn't reconcile with the site pages. Mention this in the NON_DELIVERY_SECTION message for page 5 at most. No separate rule is needed.
- Pages 1 and 2 share an address, as do pages 3 and 4. Not flagged (different sites can share a street).
- A naive extractor returns 24 identical-looking "delivered" lines. The reviewer will likely check for that.
