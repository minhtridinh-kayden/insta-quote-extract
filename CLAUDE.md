# CLAUDE.md

Take-home assessment for Insta Quote AI (full-stack role). Two parts:

- **Part A**: `POST /api/extract` takes a PDF and returns JSON: extracted line items, each carrying evidence (page + exact source text), plus a separate list of refusals with reasons.
- **Part B**: a single web page that uploads a PDF to Part A and shows the result, **including refusals in plain language**.

Time budget is ~5 hours total. Prefer small, working, well-tested steps over breadth.

Read these before writing code:

- `docs/TASK.md` — the original brief (source of truth for requirements)
- `docs/SPEC.md` — data contract, refusal codes, HTTP semantics, UI states
- `docs/FIXTURES.md` — what each sample PDF contains and the traps in it
- `docs/PLAN.md` — milestones, order of work, commit messages
- `docs/DECISIONS.md` — decision log; append to it (feeds the README)
- `fixtures/expected.json` — golden expectations per fixture; tests assert against it

## Non-negotiable rules

1. **Never output a number you cannot point to.** Every numeric value in the API response must come from a single text run on a specific page, and carry `raw` (the exact characters from the PDF) + `evidence { page, sourceText, bbox }`. `raw` must be a substring of `sourceText`, and `sourceText` must be a line of that page's `pageText`.
2. **No derived numbers in the output.** Arithmetic (qty × price, sums of lines, differences) is used *internally* for cross-checks only. Never emit a computed value in the JSON: not a computed line total, not a sum, not a difference, not a "freight" amount. Refusal messages must not contain computed numbers either.
3. **Refusing is a valid result; guessing is not.** When the document is missing, ambiguous or contradicts itself, emit a structured refusal. For contradictions, return **all** candidate values with their own evidence and do not pick one.
4. **Refuse at the smallest scope possible**: document > page > line > field. One bad page must never take down the other pages; one bad field must not discard the rest of its line.
5. **A refusal is not an error.** A processed document returns HTTP 200 even if 100% of it was refused. Only real system failures are 5xx.
6. **Refusals must reach the user unchanged.** No `catch (e) { "Something went wrong" }` anywhere. Every UI branch shows the real reason. The client validates responses with the same zod schema as the server.
7. **No LLM calls and no OCR in the extraction path.** Extraction is deterministic, coordinate-based parsing of the PDF text layer. Pages without a text layer are refused (`NO_TEXT_LAYER`). Unknown layouts fail closed (`UNRECOGNISED_LAYOUT`). See `docs/DECISIONS.md` D1–D2.
8. **Do not assign units, currencies or tax status the document doesn't state.** Keep `raw` as printed (`"$24.90"`, `"$68.00 /bag"`). Do not label amounts NZD or ex/incl GST.

## Stack

- Next.js (App Router) + TypeScript (strict), deployed on Vercel. Node runtime for the API route.
- `unpdf` (pdf.js) for text items with coordinates. `zod` for the shared schema.
- `vitest` for unit/fixture tests; `@testing-library/react` + `jsdom` for UI tests.
- Tailwind for styling (keep it minimal; must work on a phone screen).
- Upload uses a plain Route Handler (multipart). tRPC is not used because it doesn't handle file uploads well; this is noted in the README.

## Layout

```
src/lib/schema/              zod schema + types shared by server and client (one module per concept, re-exported from index.ts)
src/lib/extraction/          pure TS, no Next.js imports, fully unit-testable
  pdf.ts                     PDF bytes → pages (text runs with x, y, w, h); per-page error isolation
  rows.ts                    group runs into visual rows; build pageText and sourceText
  layout.ts                  find the table header, derive column x-ranges from header text
  table.ts                   header → line items (cells mapped to columns)
  numbers.ts                 strict parsers for money / quantity / basis; ambiguity detection
  section.ts                 classify page role from its subtitle (delivery, summary, returns…)
  notes.ts                   non-table text: printed totals, "<n> <count-noun>" mentions
  validate.ts                cross-checks: line arithmetic, total vs lines, conflicting mentions
  messages/                  RefusalCode → plain-English userMessage + suggestedAction (builders grouped by scope; describeRefusal in index.ts)
  pipeline.ts                orchestrates; try/catch per page; computes status
src/app/api/extract/route.ts HTTP layer: size/type checks, status codes, requestId
src/app/page.tsx             Part B UI (client component, explicit state machine)
src/components/              UploadForm, ResultSummary, PageStrip, LineItemTable, AttentionList, EvidencePopover
tests/                       *.test.ts(x); fixture tests read fixtures/expected.json
scripts/extract-fixtures.ts  runs the pipeline on every fixture → out/<name>.json (for review)
```

## Commands

```bash
npm run dev                  # local dev server
npm test                     # vitest run
npm run test:watch
npm run typecheck            # tsc --noEmit
npm run lint
npm run extract:fixtures     # writes out/*.json for every PDF in fixtures/pdfs
```

Before every commit: `npm run typecheck && npm test` must pass.

## Conventions

- Keep extraction code free of Next.js/React imports so it can be tested in isolation.
- Money: keep `raw`; parse `value` as a number for output, but do arithmetic in **integer cents** internally (no float comparisons).
- IDs are stable and page-scoped: line `p{page}-l{rowIndex}`, refusal `r-{code}-p{page}-…`. Item numbers restart on every page in multi-page files.
- User-facing text (`userMessage`, `suggestedAction`) is written for a tradie, not a developer: say what happened, where (page), what it means for their quote, and what to do next. No codes or stack traces in user text; codes go in `technicalDetail`.
- Tests are about the refusal rules first. Add a test with every new refusal rule.
- One responsibility per file. Prefer a folder of small focused modules behind an `index.ts` over one large file. Comments only where a rule is non-obvious, one short line.
- Tracking (Linear, team IQE): IQE-1..IQE-9 are epics, one per milestone in `docs/PLAN.md`. Every commit has its own sub-issue under its epic; epic IDs are never used in commits.
- Commits: small, one line `IQE-<n> <Capitalised subject>` where IQE-n is that commit's sub-issue (e.g. `IQE-12 Result schema and plain-language refusal messages`), no body, one logical change each. Commit history is part of the review, so never squash.
- When you make a non-obvious decision or find a limitation, append it to `docs/DECISIONS.md` (short: decision, why, cost).

## Don'ts

- Don't "fix" a document by inferring missing values (e.g. computing a line total that isn't printed, or deriving a qty unit from a price suffix like `/bag`).
- Don't sum across pages or sections of DR118. Returns/credit/summary/acceptance pages are not deliveries.
- Don't catch-and-genericise errors in the route handler or the client.
- Don't add OCR, LLM calls, a database or auth. These are README "three more days" items.
- Don't loosen a test in `fixtures/expected.json` to make it pass without recording why in `docs/DECISIONS.md`.
