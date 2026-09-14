# Apply Progress: `dominio-busqueda`

Status: all five tasks complete. Strict TDD followed throughout.

## Evidence

### RED
- Created `frontend/src/modules/listas/domain/busqueda.test.ts` with all cases from the tasks.md RED list: exports shape, case folding, true-diacritic folding, bidirectional symmetry, `ñ` whole-token collision (`pina`/`piña`, `ano`/`año`, `cana`/`caña`), substring matching, empty/whitespace queries, empty-string normalization.
- Ran `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts`.
- Result: `Failed to resolve import "./busqueda" ... Does the file exist?` — confirmed RED (module not yet created). All 16 other pre-existing test files passed (72 tests), isolating the failure to the new file.

### GREEN
- Created `frontend/src/modules/listas/domain/busqueda.ts` exporting `normalizarParaBusqueda` and `coincideConBusqueda`, pipeline `trim → NFD → strip [̀-̂,̄-ͯ] → NFC → toLowerCase`, `coincideConBusqueda` returns `true` when normalized query is `''`, otherwise `includes`.
- Ran `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts`.
- Result: 17 test files passed, 89 tests passed. RED contract now GREEN.

### TRIANGULATE
- Extended `busqueda.test.ts` with: `ñ` partial-prefix boundary (`pin`/`piña`, `an`/`año`), `ñ`/`Ñ` self-match under case folding (`Piña`/`PIÑA`, `Ñoquis`/`ñoquis`), diaeresis (`Pingüino`/`pinguino`), purity/non-mutation (determinism, argument non-mutation, astral characters, mixed-whitespace query), and whole-string-equals-content boundary.
- Ran `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts`.
- Result: 17 test files passed, 99 tests passed. No implementation correction was needed — the GREEN implementation's NFC recomposition step already satisfied the partial-prefix regression.
- Verified the NFC recomposition claim manually with `node -e`: without the `.normalize('NFC')` step, `'piña'` normalized to `[̀-̂,̄-ͯ]`-stripped NFD form still contains `'pin'` (`includes` returns `true`); with the NFC step present (as implemented), it correctly returns `false`. This confirms the design's stated failure mode is real and the implementation guards against it.

### REFACTOR
- Reviewed `busqueda.ts`: contains exactly the regex constant, one rationale comment for the U+0303 exclusion, and the two specified exports. No other comments, no extra surface. Matches the comment-free register of `lista.ts`/`articulo.ts` apart from the one design-authorized rationale comment.
- Reviewed `busqueda.test.ts`: literal string fixtures per case (no builder function needed, since the domain operates on plain strings rather than objects like `Lista`/`Articulo`), clear per-case assertions, direct `./busqueda` import.
- Ran `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts`.
- Result: 17 test files passed, 99 tests passed. No further changes made.

### Verification
- `cd frontend && pnpm test` — 17 test files passed, 99 tests passed.
- `cd frontend && pnpm exec tsc --noEmit` — clean, no errors.
- `cd frontend && pnpm lint` — clean, no errors or warnings.
- `git status --porcelain frontend/src/modules/listas/` confirms only `busqueda.ts` and `busqueda.test.ts` are new from this work unit (other untracked files in that directory predate this session). `frontend/src/modules/listas/index.ts` barrel untouched; no UI, hook, route, or InsForge file touched.

## Files changed
- `frontend/src/modules/listas/domain/busqueda.ts` (new)
- `frontend/src/modules/listas/domain/busqueda.test.ts` (new)
- `openspec/changes/dominio-busqueda/tasks.md` (all 5 tasks marked `[x]`)
