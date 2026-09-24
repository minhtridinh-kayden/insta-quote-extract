# Plan

Total budget is about 5h. Each milestone ends green (`npm run typecheck && npm test`) and with a commit using the message shown. Tick boxes as you go.

## M0. Scaffold (0:00–0:20)

- [ ] `create-next-app` refuses to run in a non-empty folder, so scaffold into `./.scaffold` and move everything up without overwriting existing files:
  `npx create-next-app@latest .scaffold --ts --app --src-dir --tailwind --eslint --import-alias "@/*" --use-npm --no-turbopack --yes`
  Then move its contents to the repo root and delete `.scaffold`. Keep our `CLAUDE.md`, `docs/`, `fixtures/`, `.claude/`, `.gitignore` (merge .gitignore entries).
- [ ] `npm i zod unpdf` and `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom tsx`
- [ ] Scripts: `test`, `test:watch`, `typecheck`, `extract:fixtures` (`tsx scripts/extract-fixtures.ts`).
- [ ] `vitest.config.ts`: `environment: "node"` by default, and `jsdom` for `*.test.tsx`.
- [ ] Commit: `chore: scaffold Next.js app with vitest, zod and unpdf`

## M1. Schema + messages (0:20–0:40)

- [ ] `src/lib/schema.ts`: zod schemas exactly as in SPEC §4; export inferred types.
- [ ] `src/lib/extraction/messages.ts`: one function per RefusalCode → `{ userMessage, suggestedAction }`, taking the context (page, field, candidates). Use the style in SPEC §7.
- [ ] Commit: `feat: result schema and plain-language refusal messages`

## M2. PDF → rows (0:40–1:15)

- [ ] `pdf.ts`: load with unpdf. For each page, try/catch → `{ page, runs }` or `{ page, error }`. Detect `%PDF-` magic bytes, encryption and 0 pages (document-level refusals).
  - Run = `{ str, x: transform[4], y: transform[5], w: width, h: height }`. Drop whitespace-only runs.
  - Page with 0 non-whitespace runs → `NO_TEXT_LAYER`.
- [ ] `rows.ts`: group by y (±2pt), sort, and build `pageText` / row strings (SPEC §1).
- [ ] Quick check: print rows for KBS-10234 page 1 and compare with FIXTURES.md.
- [ ] Tests: `rows.test.ts` (grouping, order, sourceText is a line of pageText).
- [ ] Commit: `feat: read PDF text runs per page with isolated page failures`

## M3. Table + numbers (1:15–2:00)

- [ ] `numbers.ts` + `numbers.test.ts` (**write tests first**): money, money+basis, qty, ambiguous `1.250`, missing tokens, weights with and without `total`.
- [ ] `layout.ts`: header detection and column ranges from header x. `UNRECOGNISED_LAYOUT` when none is found.
- [ ] `table.ts`: body rows → LineItem with Evidenced fields; unknown columns → `extra`; missing columns → one `COLUMN_NOT_PRESENT` per page.
- [ ] `section.ts` (SPEC §1 table) + test using the DR118 subtitles.
- [ ] `scripts/extract-fixtures.ts` → `out/*.json`. Eyeball KBS-10234 and KBS-10255.
- [ ] Commits: `test: number parsing refusal rules`, `feat: coordinate-based table extraction`, `feat: classify page sections`

## M4. Notes, cross-checks, pipeline, invariant (2:00–2:40)

- [ ] `notes.ts`: printed totals (both shapes) and count-noun mentions.
- [ ] `validate.ts`: line arithmetic, total vs lines, conflicting mentions. Integer cents. **No computed number in any output field or message.**
- [ ] `pipeline.ts`: orchestrate, try/catch per page (a thrown page → `PAGE_PARSE_FAILED` for that page only), invariant guard, status.
  Accept an optional injected page-processor so a test can force page 2 to throw.
- [ ] Tests:
  - `validate.test.ts`: mismatch → refusal with candidates and no computed numbers in the message; `LINE_ARITHMETIC_MISMATCH` with a synthetic line.
  - `pipeline.test.ts`: containment. Page 2 throws, pages 1 and 3 still produce lines, and status is `needs_review`.
  - `fixtures.test.ts`: every PDF vs `fixtures/expected.json`, plus two invariants on all fixtures: (1) every Evidenced raw ⊂ sourceText ⊂ pageText lines; (2) `forbiddenInOutput`.
- [ ] Commits: `feat: detect printed totals and conflicting counts in notes`, `feat: cross-check totals without emitting derived numbers`, `feat: extraction pipeline with per-page containment`, `test: golden fixtures and provenance invariant`

## M5. API route (2:40–3:00)

- [ ] `src/app/api/extract/route.ts` per SPEC §5: requestId (crypto.randomUUID), size limit, magic bytes, status codes, structured logs.
- [ ] `route.test.ts`: 200 with a fully refused doc (KBS-10241), 422 for a `.pdf` that is really text, 413 for oversize.
- [ ] Commit: `feat: /api/extract with honest HTTP semantics`

## M6. Part B UI (3:00–4:15)

- [ ] `page.tsx`: state machine (SPEC §6). `fetch` → parse JSON → validate with zod → branch on HTTP status. No generic catch.
- [ ] Components: `UploadForm`, `ResultSummary`, `PageStrip`, `AttentionList`, `LineItemTable`, `EvidencePopover`.
- [ ] Manually check all 6 fixtures in the browser, plus a renamed .txt file (422) and a stopped dev server (network error).
- [ ] Mobile width check (375px).
- [ ] Commits: `feat: upload page with explicit request states`, `feat: show refusals and evidence in plain language`, `feat: page strip and grouped line items`

## M7. UI refusal tests (4:15–4:35)

- [ ] `result-view.test.tsx`: render the KBS-10241 result → shows the NO_TEXT_LAYER userMessage, and the text does not match `/something went wrong|error occurred|no items found/i`.
- [ ] `page-states.test.tsx`: mock fetch for 422 / 500 / network failure / malformed JSON → each shows its specific message (and requestId for 500).
- [ ] Commit: `test: refusals reach the screen unchanged`

## M8. README + deploy (4:35–5:00)

- [ ] README built from `docs/DECISIONS.md` and the real `out/*.json`: how to run, API example, the 3 questions (hardest decision / not confident / three more days), and a per-fixture results table (including anything that doesn't match expectations).
- [ ] Deploy to Vercel; add the URL to the README.
- [ ] Commit: `docs: README with decisions, limitations and results`

## Stretch (only if everything above is done by ~3:45)

- Resolve actions in AttentionList (pick a candidate / type a value) → stored with `source: "user"`, visibly distinct. Commit: `feat: let users resolve refusals without losing provenance`
- Highlight `bbox` on a rendered page image.

---

## Kickoff prompts for Claude Code

Paste one milestone at a time.

**Start:**
> Read CLAUDE.md and every file in docs/. Summarise back, in 10 bullets or fewer, the non-negotiable rules and what M0 involves. Then do M0 exactly as written in docs/PLAN.md, run typecheck and tests, and commit.

**Each next milestone:**
> Do M<n> from docs/PLAN.md. Follow SPEC.md exactly. Write the tests listed for this milestone and make them pass. Run `npm run typecheck && npm test`, then commit with the message(s) from the plan. If you had to deviate from the spec, append the reason to docs/DECISIONS.md.

**Audit (after M4 and again before submitting):**
> /audit-output
