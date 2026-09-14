```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:d2410e36e999d510070a915d356c92501bcaf51f034994bb8e6f430f44e6b594
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 21/21
test_command: cd frontend && pnpm test
test_exit_code: 0
test_output_hash: sha256:1ec8ad4555879d5b9350218b50bcb69555ebbcb93ce932998b17a6fbfa185b4e
build_command: cd frontend && pnpm exec tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:e64612cd61ce0f97ac39d2a12bd1c02a56aacee39e6346190e25b0c736fae63c
```

# Verification Report: dominio-busqueda

## Verdict

PASS WITH WARNINGS — 0 CRITICAL, 2 WARNING, 3 SUGGESTION. All 10 spec requirements and all 21 scenarios have passing runtime coverage in `frontend/src/modules/listas/domain/busqueda.test.ts` (27 tests). The implementation matches the design's fixed pipeline exactly, the NFC step was empirically proven load-bearing, and the Strict TDD evidence in `apply-progress.md` is corroborated by independent arithmetic and file layout rather than merely asserted. Nothing blocks archive. No implementation, test, spec, design, or task file was modified by verification.

## Commands and evidence

| Exact command | Exit | Result |
|---|---|---|
| `cd frontend && pnpm test` | 0 | 17 files, 99 tests passed |
| `cd frontend && pnpm exec tsc --noEmit` | 0 | Clean, no output |
| `cd frontend && pnpm lint` | 0 | eslint clean, no errors or warnings |
| `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts` | 0 | 17 files, 99 tests — the forwarded separator runs the whole suite, it does not focus |
| `cd frontend && pnpm exec vitest run src/modules/listas/domain/busqueda.test.ts` | 0 | Truly focused: 1 file, **27 tests** |
| `cd frontend && pnpm exec eslint <both new files>` | 0 | No findings |
| `cd frontend && pnpm exec prettier --check <both new files>` | 1 | `busqueda.test.ts` not formatted — see WARNING-1 |

## Spec compliance matrix

Authoritative retrieved counts: **10 requirements, 21 scenarios** (`rg -c '^### Requirement:'` = 10, `rg -c '^#### Scenario:'` = 21). Every scenario maps to at least one test that passed at runtime.

| # | Requirement | Covering tests (all passing) | Status |
|---|---|---|---|
| 1 | Public search contract | `exports > returns a string ... and a boolean`; purity block covers determinism, non-mutation, no-throw | COVERED |
| 2 | Case folding (2 scenarios) | `case folding` x3: `AZUCAR`, `Azucar`, `azucar` vs `Azúcar` | COVERED |
| 3 | True-diacritic folding (2 scenarios) | `folds every accented vowel, upper and lower` (exact equality `aeiouaeiouu u`); `Pingüino`/`pinguino` | COVERED |
| 4 | `ñ`/`Ñ` preserved as distinct letters (4 scenarios) | `ñ whole-token collision regression` x3 (`pina`, `ano`, `cana`); `ñ still matches itself` x2 (`Piña`/`PIÑA`, `Ñoquis`/`ñoquis`) | COVERED |
| 5 | `ñ` preservation at partial-prefix boundary (2 scenarios) | `ñ partial-prefix boundary regression` x2 (`pin`/`piña`, `an`/`año`) — **its own describe block, not collapsed** | COVERED |
| 6 | Substring matching (3 scenarios) | `substring matching in multi-word content` x3; plus `whole-string vs substring boundary` | COVERED |
| 7 | Normalization applied symmetrically (2 scenarios) | `bidirectional symmetry` x2 (unaccented query vs accented content, and the reverse) | COVERED |
| 8 | Empty and whitespace-only queries (3 scenarios) | `empty and whitespace-only queries` x3 — asserts **both** non-empty content (`Azúcar`, `Pan integral`) and empty content (`''`); plus `\t\n` mixed-whitespace | COVERED |
| 9 | Normalizing an empty string never throws (1 scenario) | `returns the empty string and does not throw` (`not.toThrow()` + value assertion) | COVERED |
| 10 | Pure domain boundary (1 scenario) | Structural: `busqueda.ts` has **zero import statements**; test file's only import is `./busqueda`; zero `vi.mock`, `vi.fn`, `render(`, `screen.`, `userEvent`, `fetch` | COVERED (structural, see SUGGESTION-2) |

**No requirement is without test coverage. The two `ñ` failure modes are covered in two separate describe blocks (lines 40–52 whole-token, lines 89–97 partial-prefix).**

## Design coherence

The design fixes the pipeline as `trim → NFD → strip U+0300–U+0302 and U+0304–U+036F → NFC → lowercase`. `busqueda.ts` lines 6–13 implement exactly that order, with no deviation:

```
texto.trim().normalize('NFD').replace(MARCAS_DIACRITICAS_PLEGABLES, '').normalize('NFC').toLowerCase()
```

`MARCAS_DIACRITICAS_PLEGABLES = /[\u{0300}-\u{0302}\u{0304}-\u{036F}]/gu` matches the design's declared constant character for character. **U+0303 is genuinely outside both ranges**, verified empirically rather than by reading alone: `/[\u{0300}-\u{0302}\u{0304}-\u{036F}]/gu.test('̃')` returns `false`. The single design-authorized rationale comment documenting the exclusion is present (lines 1–3) and is the file's only comment.

`coincideConBusqueda` normalizes both arguments through the same primitive, returns `true` when the normalized query is `''`, and otherwise uses `.includes` — exactly the decided contract. The module-level `/g` regex is used only with `.replace()`, which resets `lastIndex`, so there is no stateful-regex hazard; the determinism test guards this.

### The NFC step is load-bearing — empirically proven

Independently reproduced with `node -e` on Node v26.8.1, running the pipeline with and without `.normalize('NFC')`:

```
normalize(piña) WITH  NFC = "piña" -> U+0070 U+0069 U+00F1 U+0061
normalize(piña) WITHOUT NFC = "piña" -> U+0070 U+0069 U+006E U+0303 U+0061

match(piña,"pin") WITHOUT NFC = true
match(piña,"pin") WITH    NFC = false
match(año,"an")   WITHOUT NFC = true
match(año,"an")   WITH    NFC = false

whole-token (both forms false, as design predicted):
  match(piña,"pina") noNFC/NFC = false / false
  match(año,"ano")   noNFC/NFC = false / false
```

Without NFC the decomposed content retains a bare `U+006E`, so `pin` leaks a match against `piña`. With NFC it does not. The design's claim that the whole-token cases fail correctly either way, and that only the partial-prefix cases require recomposition, is confirmed exactly.

## Adversarial analysis: mutation testing

To answer "does any requirement pass only by accident of the chosen test data", the committed assertions were transcribed verbatim and run against nine seeded faults. **Every fault was killed**; no mutant survived.

| Mutant | Killed by |
|---|---|
| M1 drop `.normalize('NFC')` | 2 — `prefix/pin-vs-piña`, `prefix/an-vs-año` (the *only* guards for this step) |
| M2 strip full U+0300–U+036F (`ñ` folds) | 5 — all three whole-token plus both partial-prefix |
| M3 drop `.trim()` | 2 — whitespace-only query, mixed-whitespace query |
| M4 drop `.toLowerCase()` | 8 — case folding, vowel folding, symmetry, `ñ` self-match, diaeresis |
| M5 equality instead of `.includes` | 3 — substring mid-content, substring at start, astral |
| M6 normalize content only | 1 — accented-query symmetry |
| M7 normalize query only | 3 — unaccented symmetry, case, diaeresis |
| M8 drop the strip step | 4 — both symmetry, case, diaeresis |
| M9 empty query returns `false` | 3 — all three empty/whitespace scenarios |

M1 is the important result: the partial-prefix pair is the sole regression guard for NFC recomposition. Had TRIANGULATE collapsed the two `ñ` failure modes into one test, dropping NFC would have gone undetected. It did not collapse them.

## Assertion quality

No tautologies (`expect(true).toBe(true)`), no assertion that fails to call production code, no ghost loops, no empty-collection assertion without a companion, no smoke tests, no implementation-detail coupling, zero mocks. All 27 tests invoke `normalizarParaBusqueda` or `coincideConBusqueda` with literal fixtures.

The empty-query rule is asserted against non-empty content **and** empty content, so it is not a one-sided check. Negative expectations are well represented: 6 of 27 tests assert `false`, and they are the discriminating ones (M1 and M2 are killed exclusively by `false` assertions).

**Assertion quality: 0 CRITICAL, 0 WARNING** (2 minor observations recorded as SUGGESTION-1 and SUGGESTION-3).

## Strict TDD compliance

| Check | Result | Details |
|---|---|---|
| TDD evidence reported | PASS | RED / GREEN / TRIANGULATE / REFACTOR / Verification sections all present in `apply-progress.md` |
| RED confirmed (test file exists) | PASS | `busqueda.test.ts` exists, 27 tests |
| GREEN confirmed (tests pass now) | PASS | All 27 pass in an isolated `vitest run` |
| Triangulation adequate | PASS | 10 additional cases across 5 new describe blocks |
| Safety net | PASS | Both files genuinely new (`??` untracked), so "N/A (new)" is accurate |
| Refactor | PASS | Exactly the regex constant, one rationale comment, two exports |

**The reported cycle counts reconcile exactly against the committed file** — this is corroboration, not acceptance of an assertion:

- Claimed 72 pre-existing tests across 16 files. Observed: 99 total across 17 files; the focused run shows `busqueda.test.ts` holds exactly 27. `99 − 27 = 72`, `17 − 1 = 16`. Exact match.
- RED claimed 89 tests after GREEN, i.e. 17 new tests. The first eight describe blocks (lines 3–87), which map one-to-one onto the eight RED bullets in `tasks.md`, contain `1+3+1+2+3+3+3+1 = 17` tests. Exact match.
- TRIANGULATE claimed 99, i.e. 10 further tests. The last five describe blocks (lines 89–145), mapping onto the five TRIANGULATE bullets, contain `2+2+1+4+1 = 10` tests. Exact match.
- The RED blocks occupy a contiguous leading region and the TRIANGULATE blocks a contiguous trailing region — the strictly-appended layout a genuine RED-then-TRIANGULATE sequence produces. Retrofitted evidence has no reason to reproduce this split at these exact counts.
- The apply phase's own `node -e` NFC claim was independently reproduced above, with the same outcome.
- TRIANGULATE's claim that no implementation correction was needed is consistent with the GREEN description, which already lists NFC in the pipeline.

TDD evidence is real and internally consistent with the committed test file.

## Test layer distribution

| Layer | Tests | Files | Tools |
|---|---|---|---|
| Unit | 27 | 1 | Vitest 4.1.11 |
| Integration | 0 | 0 | not applicable at a pure domain boundary |
| E2E | 0 | 0 | not installed |

Unit-only is correct here: the module is pure string-to-string logic with no consumer yet. No coverage tool is configured in this project, so per-file coverage is not reported (not a failure).

## Scope discipline

`git status --porcelain` confirms exactly two new files under `frontend/` for this change:

```
?? frontend/src/modules/listas/domain/busqueda.test.ts
?? frontend/src/modules/listas/domain/busqueda.ts
```

- `frontend/src/modules/listas/index.ts` is tracked and appears in no modified entry — **untouched**, confirmed.
- No UI, hook, route, InsForge, repository, mock, dependency, configuration, or generated file changed.
- The other untracked entries under `domain/` (`lista.ts`, `lista.test.ts`, `articulo.ts`, `articulo.test.ts`) predate this work unit and belong to the archived `dominio-lista` and `dominio-articulo` changes.
- Total new authored lines: 26 (`busqueda.ts`) + 145 (`busqueda.test.ts`) = 171, well inside the 800-line review budget. The 220–320 forecast was conservative.

## Task completion

All 5/5 tasks in `tasks.md` are `[x]`. No unchecked `- [ ]` implementation task line remains. Each task's claimed deliverable is present in the code: RED/GREEN/TRIANGULATE map onto the describe blocks as reconciled above, REFACTOR's "only the regex constant, one rationale comment, two exports" is literally true of `busqueda.ts`, and the fifth task's three commands were re-run here with the exit codes recorded above.

## Issues

### CRITICAL

None.

### WARNING

**WARNING-1 — `busqueda.test.ts` is not Prettier-formatted.** `pnpm exec prettier --check` exits 1 on one line: line 117, `expect(normalizarParaBusqueda('Azúcar')).toBe(normalizarParaBusqueda('Azúcar'))`, which Prettier would wrap across three lines. Context that lowers the severity: `pnpm lint` (eslint, the project's declared gate) passes, Prettier is not wired into it, and the archived `dominio-lista` shipped with `lista.ts` and `lista.test.ts` equally unformatted — so this is the repo's existing baseline, not a new standard. Context that keeps it a warning: the archived `dominio-articulo` verification did run `prettier --check` and it passed there, and a later `prettier --write` would mutate this file, which invalidates any frozen review candidate. Cosmetic only; no behavior or spec requirement is affected.

**WARNING-2 — an unaccounted tracked-file modification is in the working tree.** `docs/tareas/000-indice.md` shows as modified but appears in no "Files changed" list in `apply-progress.md`. Inspecting the diff, it flips tasks **040 and 041** to `☑` and leaves row **042 unchanged at `☐`** — so it is provably not produced by this change, and it is outside the frontend scope boundary that `tasks.md` defines. It is recorded because `apply-progress.md`'s scope evidence was narrowed to `git status --porcelain frontend/src/modules/listas/` rather than the whole tree, so a whole-tree claim of cleanliness was never actually established. Reconcile or attribute it before archive; it does not block.

### SUGGESTION

**SUGGESTION-1 — the exports test is type-only.** `expect(typeof normalizarParaBusqueda('azucar')).toBe('string')` and the boolean counterpart assert shape without asserting a value. Normally a warning under the assertion-quality rules, downgraded here because this is the literal text of the spec scenario ("THEN it returns a string" / "THEN it returns a boolean") and every value behavior is exhaustively asserted elsewhere in the same file.

**SUGGESTION-2 — Requirement 10 is enforced by inspection, not by a gate.** "MUST NOT import React, InsForge, persistence…" is currently guaranteed only by `busqueda.ts` happening to have zero imports. An ESLint `no-restricted-imports` or import-boundary rule on `modules/*/domain/**` would make the pure-domain boundary mechanically enforced across all three domain modules rather than re-verified by hand each change.

**SUGGESTION-3 — uppercase partial-prefix is untested, and one determinism assertion is weak.** Requirement 5's prose names `n`/`N`, but only the lowercase boundary is asserted. Verified correct by hand (`coincideConBusqueda('Ñoquis','N')` returns `false`, and `true` without NFC), and it adds no fault-detection beyond the lowercase pair, so it is optional hardening. Separately, `expect(coincideConBusqueda('Azúcar','azucar')).toBe(coincideConBusqueda('Azúcar','azucar'))` would hold even if the function always returned `false`; it is backstopped by two other tests asserting that same call is `true`.

## Next step

`sdd-archive`. No CRITICAL finding and no blocker. Both warnings are informational and neither requires an implementation change; WARNING-1 is a cosmetic formatting decision and WARNING-2 concerns a file outside this change.
