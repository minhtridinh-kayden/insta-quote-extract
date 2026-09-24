---
description: Audit extraction output against the provenance rules and fixture expectations
---

Run `npm run extract:fixtures`, then audit every file in `out/` against the rules in CLAUDE.md. Do not change code in this command; report only.

For each fixture, check and report:

1. **Provenance**: every `Evidenced` value has `raw` ⊂ `evidence.sourceText`, and the page number exists. List any violation with its JSON path.
2. **No derived numbers**: collect every number-like token in the output (values, raws, userMessage, technicalDetail, suggestedAction), ignoring requestId and bbox. Each one must appear in the PDF text of the cited page (use `pdftotext -layout -f N -l N`). List any token that doesn't.
3. **Expectations**: compare with `fixtures/expected.json` (status, lineCount, refusal codes/scopes/pages, forbiddenInOutput).
4. **Message quality**: read every `userMessage` as a non-technical tradie would. Flag any that contain codes, the word "error", jargon, or no next step.
5. **Over-refusal**: flag any refusal on KBS-10234 (it's the clean control file).

Finish with a table: fixture | pass/fail | issues. Then list concrete fixes, most important first.
