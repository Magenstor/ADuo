```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:b06fa261790270e9f2bc966b90faea0b2a55ec983188518f94f8af440c9d6244
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 11/11
scenarios: 26/26
test_command: cd frontend && pnpm test
test_exit_code: 0
test_output_hash: sha256:9c650639edfed4e988c1c48fb233c025bc447d29859cfdab953384ea5134ceb8
build_command: cd frontend && pnpm build
build_exit_code: 0
build_output_hash: sha256:cc829df8cc5d12346842d026e16a29bc151dae44de4b207f82c4538203c9bdd5
```

# Verification Report: hooks-aplicacion-listas (third verification — scoped re-verify after the W6 remediation)

**PASS WITH WARNINGS — W6 is closed with independently reproduced, load-bearing runtime evidence; nothing regressed; no blocker remains.** Every configured command exits 0 (28 files / 219 tests, +2 over the previous report). The two test cases added by the narrow `sdd-apply` for `tasks.md` section 7 are load-bearing: with the new `application/fallo.ts` helper mutated back to the in-place `Object.assign(causa, { tipo })` form, the full suite fails exactly those two cases and nothing else (2 failed / 217 passed), and my own re-run of the original W6 probe (a second `useHogar()` consumer reading the household error after both shopping hooks rendered under a `configuracion` error) now passes on the candidate and fails under the same mutation. Two spot-checked mutations from the previous report (M1, M7) still fail exactly the intended tests. The previous report's spec matrix, blocker-closure table (C1–C9), design coherence, TDD compliance and warnings W1–W5 are carried over unchanged where the candidate did not move; every carried block says so. No production or test code was edited; every mutation and the throwaway probe were restored; no commit was created.

**Change**: hooks-aplicacion-listas · **Mode**: Strict TDD (orchestrator-declared and `openspec/config.yaml` `strict_tdd: true`) · **Previous report**: verdict `pass_with_warnings`, evidence `sha256:d9fccc79…`, 0 CRITICAL / 6 WARNING (W1–W6) / 3 SUGGESTION, 217 tests.

## Status and ownership

Artifact store `openspec`, repo-local, allowed edit root `/Users/cmotero/repos/ADuo`. Read directly: the previous verify report (baseline), `tasks.md` (37 rows, 37 `[x]`, 0 unchecked; section 7 adds the RED/GREEN pair for W6), the last section of `apply-progress.md` (`2026-09-15 — Section 7`), both specs (heading count re-verified: 11 `### Requirement:` / 26 `#### Scenario:`), the new `frontend/src/modules/listas/application/fallo.ts`, the two hooks, the two hook test files, `index.ts`/`index.test.ts`, `shared/hogar/hogar-repository.ts` and `application/hogar-listas.tsx` (for the follow-up assessment). The runtime attempt was acquired by the parent (`state: proceed`); no acquire or settle was issued here. Skill resolution: `none` — no `## Skills to load before work` block was injected; the phase skill, shared protocol, strict-TDD module and report format were loaded from `~/.claude/skills`. `git status --porcelain` is byte-identical before and after verification (diffed after the last restore and the probe deletion).

## Independent command evidence

| Command | Exit | Output hash (sha256) | Result |
|---|---|---|---|
| `cd frontend && pnpm test` | 0 | `9c650639edfed4e988c1c48fb233c025bc447d29859cfdab953384ea5134ceb8` | 28 files, 219 passed |
| `cd frontend && pnpm exec tsc --noEmit` | 0 | `e64612cd61ce0f97ac39d2a12bd1c02a56aacee39e6346190e25b0c736fae63c` | clean (hash identical to the two previous reports) |
| `cd frontend && pnpm lint` | 0 | `4b973595603faa59a9dd59bb3295af5d0d582d1d590f9b514dfa7daa4eac01f1` | clean (identical) |
| `cd frontend && pnpm check` | 0 | `69b6e7d277a737526c4dc8ce68538f928aa34f032df9f12a2cbd06dffec3d156` | clean (identical) |
| `cd frontend && pnpm build` | 0 | `cc829df8cc5d12346842d026e16a29bc151dae44de4b207f82c4538203c9bdd5` | built; >500 kB chunk warning (pre-existing, nonblocking) |

The `pnpm test` wrapper is `vitest run`, so the test and build hashes vary with timing lines; tsc/lint/check are byte-stable. Focused runs used `pnpm exec vitest run <file>`. Coverage: no `@vitest/coverage-*` package is installed — coverage analysis skipped, not a failure. Evidence revision = sha256 of a manifest containing the tracked frontend diff, the sha256 of every untracked frontend file (12, now including `fallo.ts`) and every OpenSpec input (proposal, design, tasks, apply-progress, both specs), and the five command exit codes and output hashes.

## What changed since the baseline (61 authored lines, one new file)

| File | Change | Hash (sha256, first 8) |
|---|---|---|
| `application/fallo.ts` (new, 11 lines) | `fallo<T extends string>(tipo, causa): Error & { tipo: T }` builds `new Error(mensaje, { cause: causa })` and assigns `tipo` on the **new** object only; imports nothing | `bbb7959d` |
| `application/useListas.ts` (+1/−5) | drops the local `fallo`, `import { fallo } from './fallo'`; the `hogar.estado === 'error' ? fallo('realtime', hogar.error)` mapping (L:157) is otherwise unchanged | `59642a2b` (was `1250c791`) |
| `application/useArticulos.ts` (+1/−5) | same | `71b22741` (was `4522a2f1`) |
| `useListas.test.tsx` (+19, L:374) and `useArticulos.test.tsx` (+19, A:768) | one new case each: `exposes a non-realtime household error as a new realtime error without relabeling the shared object` — `useHogar` mocked `{ estado: 'error', error: Object.assign(new Error('household id is not a uuid'), { tipo: 'configuracion' }) }`; asserts the household object still reads `tipo === 'configuracion'` after render, `result.current.error` is `not.toBe(errorHogar)`, and matches `{ tipo: 'realtime', message, cause: errorHogar }` | — |

`fallo` is **not** exported from `frontend/src/modules/listas/index.ts` (the barrel exports `useListas`, `useArticulos` and the two types only; `index.test.ts` still asserts the runtime key set is exactly `['useArticulos', 'useListas']` and passes). `hogar-contexto.tsx` (`026487cb`) and `hogar-listas.tsx` are unchanged since the baseline.

## W6 closure

| Check | Evidence |
|---|---|
| Original W6 probe re-run on the candidate | Throwaway `src/__verify_probe_w6.test.tsx` (deleted after the run): `useHogar` mocked as `{ estado: 'error', error: <Error tipo 'configuracion'> }`, real `crearListasCollection` / `crearArticulosCollection` preloaded, `renderHook(useListas)` + `renderHook(useArticulos('lista-1'))`, then a third `renderHook(useHogar)` as an independent consumer. Assertion `{ hookL: 'realtime', hookA: 'realtime', hogar: 'configuracion', sameObjectL: false, sameObjectA: false, causeL: true, causeA: true }` — **passes**. On the baseline the same probe read `hogar: 'realtime'` with `sameObject: true` |
| Mutation of the helper (my own, once) | `fallo.ts` body replaced by `const error = causa instanceof Error ? causa : new Error(String(causa)); return Object.assign(error, { tipo })`. Probe: **1 failed** (`sameObjectL/A: true` received). Full suite: **3 failed / 217 passed (220, probe included)** = the probe + exactly L:374 and A:768, each with `AssertionError: expected 'realtime' to be 'configuracion' // Object.is equality` at `expect(errorHogar.tipo).toBe('configuracion')` — verbatim the RED text recorded in apply-progress section 7 |
| Restore | `fallo.ts` hash `bbb7959d…` re-verified; probe deleted; `rg MUTATION|__verify_probe src/` empty; focused L+A+probe-free re-run L 13/13, A 22/22; full suite 219/219 |
| Task rows | Section 7 RED/GREEN both `[x]`; RED text matches; GREEN "helper not exported from the module barrel" confirmed by `index.ts` and X |

What the fix proves: a household error taken from context is never mutated by a shopping hook; every other `useHogar()` consumer keeps the original `tipo` discriminator, and the hook's own `error` is a distinct object that keeps the message and exposes the original through `cause`. The pre-existing realtime-error cases (L:345, A:734), the `persistence` rollback cases and the `validation` refusals go through the same helper and stay green, so the three other `tipo` paths are triangulated by existing tests.

**Residual not covered by the fix (demoted to SUGGESTION S5)**: both hooks still label every household error `realtime` regardless of its original `tipo` (`consulta` → `query` mapping not applied; the writer records this as a product decision outside spec/design). The discriminator is now reachable through `error.cause.tipo` without side effects, no spec scenario composes a shopping hook with a resolution error, and the H1 scenarios remain proven on `useHogar` alone — so this is no longer a runtime defect.

## Spec coverage matrix (11 requirements, 26 scenarios) — carried over from the baseline

COMPLETE requires a passing test whose assertions cover every THEN/AND clause. PARTIAL means a passing test covers the scenario's primary behavior at runtime but one AND clause is not asserted; no scenario is UNTESTED or FAILING. **Envelope counting rule**: the envelope counts a scenario as complete when a covering test passed at runtime for its primary behavior (COMPLETE or PARTIAL), because the phase decision gates make only UNTESTED/FAILING scenarios CRITICAL and the report validator admits a passing verdict only with complete counts; the missing clauses of PARTIAL rows are WARNINGs W2/W4. Under the previous report's stricter rule (PARTIAL excluded) this candidate would read 22/26 scenarios and 7/11 requirements; both numbers are given so the orchestrator can apply either reading. Aliases (under `frontend/src`): HR=`shared/hogar/hogar-repository.test.ts` (6); HC=`shared/hogar/hogar-contexto.test.tsx` (7); HB=`modules/listas/application/hogar-listas.test.tsx` (9); RT=`modules/listas/infrastructure/realtime.test.ts` (24); L=`modules/listas/application/useListas.test.tsx` (13); A=`modules/listas/application/useArticulos.test.tsx` (22); X=`modules/listas/index.test.ts` (1). Change-related total: 82 of 219. **Carry-over note**: the section-7 unit added no spec scenario and moved no row; every test named below was re-executed in this run (219/219) and the row-level evidence is unchanged, so the matrix is reproduced verbatim from the baseline with only the alias counts updated. The two new cases (L:374, A:768) sit outside the matrix as design-quality coverage for W6.

| Requirement | Scenario | Result | Runtime evidence |
|---|---|---|---|
| H1 Explicit household resolution states | One membership resolves a household | COMPLETE | HR `maps one membership, its household, and only its members`; HC `exposes a resolved household without exposing SDK data` |
| H1 | No memberships are not a read failure | COMPLETE | HR `distinguishes no membership from invalid multiple membership` (`sin-hogar` half: no household, no `configuracion` error) |
| H1 | Multiple memberships are configuration-invalid | COMPLETE | HR same test (`configuracion` error). AND clause "no shopping resources are initialized": the conditional mount `estado.estado === 'ready' && Recurso` is now exercised on its false branch for both `loading` (HB remount case) and `error` (HB realtime-error case: boundary withdrawn, `crearListasCollection` stays at 1); the branch is cause-independent. Previously PARTIAL |
| H1 | Membership or member loading fails | COMPLETE | HR `surfaces membership reads as errors rather than an empty household`; HR `surfaces a failed household read…` / `…members read…` (each fails exactly one parallel read; asserts `household denied` / `members denied`, `tipo: 'consulta'`) |
| H2 Provider-owned, household-scoped resources | Consumers receive projections rather than storage handles | PARTIAL (W2) | X proves the barrel exports exactly `useArticulos`, `useListas`; every documented member is used across L/A; `tsc` fixes the return literal to documented keys. No runtime test asserts the hook return key set or the absence of handles |
| H2 | Household isolation applies to shared resources | COMPLETE | HB `cleans household A before it publishes B and removes only A query keys`; RT `drops a realtime message from another household channel`; L `projects only current-household lists…`; A `filters by active list and household…` |
| H3 Realtime lifecycle and error visibility | Subscription setup succeeds | COMPLETE | RT `registers every handler before starting the socket connection` (8 events, `max(on) < connect`); HB `keeps exactly one active subscription after Strict Mode replays setup` (real `iniciarSuscripcionHogar` over a fake socket) |
| H3 | Realtime subscription fails | COMPLETE (was PARTIAL, blocker) | HB `exposes a realtime failure reported after ready as a household error without re-creating the boundary` (error emitted after ready → public `error`, subscription count stays 1); HB `reports a failed preload without publishing a stale resource` (setup-time `alError`); RT `reports and rejects an unsuccessful subscription instead of exposing readiness`; RT `invokes the reporter…`. P2 mutation proves the provider half is load-bearing |
| H3 | Unmount cleans up external resources | COMPLETE | HB Strict Mode case (after unmount: zero handlers, `unsubscribe` once, no `disconnect`); HB `stops a subscription that settles after unmount before it cleans the collections`; RT `removes the handlers, unsubscribes without disconnecting, and is idempotent` |
| H4 Strict Mode and session/household transitions are safe | Strict Mode does not leave duplicate subscriptions | COMPLETE | HB Strict Mode case (real ownership accounting); HC `rejects a late household A resolution after a Strict Mode A to B replacement` |
| H4 | Session changes while prior resources are active | COMPLETE | HB `does not let a remounted boundary set up until the previous teardown finished` (real provider composition); HC `never lets a child render observe the previous household during …` ×2 (render-phase probe; M7 re-run here fails exactly these two); HC `keeps a new session loading until its own resolution wins`; L/A retained-action refusals |
| S1 Public shopping hook contract | Hooks expose the complete supported public surface | PARTIAL (W2) | Same gap as H2-S1: members exercised individually, key set never asserted |
| S1 | A persistence failure is observable | COMPLETE | L `restores the previous list name when the rename persistence fails` (outcome + `error.tipo === 'persistence'`); A `restores the previous article content when the edit persistence fails` |
| S2 Household and list filtering with deterministic ordering | Lists and articles are filtered to their owning scope | COMPLETE | L `projects only current-household lists in createdAt and ID order`; A `filters by active list and household and orders pending records before bought records` |
| S2 | Projection ordering remains deterministic | COMPLETE | L `breaks createdAt ties by ID…`; A `breaks createdAt ties by ID and keeps that order after a rollback`; A `keeps deterministic order when a realtime insert lands while a rollback is still pending` |
| S3 Action validation prevents invalid mutations | Invalid list name is rejected before creation | PARTIAL (W4a) | L `rejects invalid and unavailable mutations before persistence` covers `crear('   ')` → validation, no insert, and unavailable rename/delete. `renombrar` of a current list with an invalid name (same `crearLista` validator, `useListas.ts:120-121`) is not exercised |
| S3 | Article action cannot escape its list scope | COMPLETE | A `rejects invalid, cross-list, and unavailable actions before a write` (`otra-lista` exists in `lista-2` in the real collection; no write) |
| S4 Single-record mutations are optimistic and rollback safely | Optimistic create becomes authoritative on server echo | COMPLETE | L `keeps an optimistic list visible while its create is pending and converges on the server echo`; A `keeps an optimistic article visible while its add is pending…` (provisional values visible; server `updatedBy` wins after refetch; no hook-level dedup) |
| S4 | Failed article edit rolls back | COMPLETE | A `restores the previous article content when the edit persistence fails` |
| S4 | Failed mark, unmark, or single delete rolls back | COMPLETE | A `restores the previous bought state when marcar and desmarcar persistence fails`; A `hides a deleted article while its persistence is pending and restores it on failure` |
| S5 List deletion preserves child visibility semantics | Pending list deletion hides its children without child writes | COMPLETE | A `hides the child subtree while the parent list deletion is pending and issues no child delete` (`eliminarArticulo` never called; `eliminarLista('lista-1')` once); L `hides a list while its delete is pending…` |
| S5 | Failed list deletion restores the complete visible subtree | COMPLETE | A `restores the complete child subtree when the parent list deletion fails` (order `['a','b']`, `ready`); L restores `['a','b']` |
| S6 Clear-bought reports and preserves partial outcomes | Clear-bought has mixed results | COMPLETE | A `removes the cleared articles, restores the failed one and leaves unbought records visible`; A `keeps a successful clear-bought deletion removed while returning failed IDs in selected order`; A `never deletes a foreign-household bought article that shares the requested list ID` |
| S6 | Clear-bought finds nothing to delete | COMPLETE | A `makes no delete request and returns empty outcome collections when the list has nothing bought` |
| S7 Shopping hooks react safely to household lifecycle and realtime failures | Household change clears stale shopping data | PARTIAL (W4c) | L `clears its projection synchronously when a stale household resource is retained` (`[]`, `loading`); L `rejects a retained A callback after household B becomes current`; A `refuses a retained household-A action after household B becomes current`; A `hides all child projections when the parent list is no longer current`. Not asserted: B's projection contents after the A→B transition (the B fixtures are mounted but `listas`/`articulos` are not read after `rerender`) |
| S7 | Realtime error is exposed without corrupting projections | COMPLETE (was UNTESTED, blocker) | L:345 and A:734 realtime-error cases (`[]`, `ready: false`, `error.tipo === 'realtime'` with cause, retained rows not substituted, no write); HB realtime-error case for the provider half. P1 mutations prove both hook mappings are load-bearing |

**Compliance summary** (unchanged): 26/26 scenarios have a passing covering test (22 COMPLETE, 4 PARTIAL at WARNING level: H2-S1, S1-S1, S3-S1, S7-S1); 11/11 requirements covered (7 with every clause proven: H1, H3, H4, S2, S4, S5, S6). Delta vs previous report at equal counting: +3 COMPLETE scenarios (H1-S3, H3-S2, S7-S2), +2 fully proven requirements (H1, H3); the two previous blocker rows are the ones that moved.

## Blocker closure table (C1–C9) and W6

| Group | Finding | Status | Evidence in this run |
|---|---|---|---|
| C1 | Stale household observable during session replacement; no unmount invalidation | CLOSED | **M7 re-run here** (`estadoVisible` returns stored state regardless of session) → HC 2 failed / 5 passed, exactly `never lets a child render observe the previous household during a different session` (`expected [ 'ready' ] to deeply equal [ 'loading' ]`) and `… during sign-out` (`expected [ 'ready', 'loading' ] to deeply equal [ 'loading', 'loading' ]`); restored, HC 7/7. Unmount row remains a disclosed contract pin (W1) |
| C2 | Stale actions and late errors not generation-safe | CLOSED | **M1 re-run here** on the post-fix `useListas.ts` (drop `alcanceActual.current !== alcance` from `crear`) → L 1 failed / 12 passed, exactly `rejects a retained A callback after household B becomes current` (`expected { ok: true, …(1) } to match object { ok: false }`); restored, L 13/13. M2/M4 stand on the first report |
| C3 | Parent visibility not reactive | CLOSED | Carried over (A parent-pending / parent-rollback cases green in 219/219; M3b on the first report); not re-mutated |
| C4 | Pending setup/teardown ownership incomplete | CLOSED | Carried over (HB cases green; M5/M6 on the first report); not re-mutated |
| C5 | Null `meta` bypasses reporting; handlers active after abort | CLOSED | Carried over (RT cases green); orchestrator-confirmed previously |
| C6 | 21 scenarios without behavioral evidence; C6-residual realtime-error chain | CLOSED | Carried over; P1/P2 on the baseline. The P1 mapping lines survive the section-7 refactor unchanged (L:157, A:284), and the realtime-error cases L:345 / A:734 are green |
| C7 | TDD evidence incomplete/false | CLOSED | Section-7 table: RED text reproduced verbatim by my mutation; safety net 33/33 (L 12, A 21) matches my per-file counts minus the two new cases; GREEN 35/35 focused reproduced (L 13 + A 22) |
| C8 | Candidate exceeds authorized single-PR cap | RECLASSIFIED (size fact under the user-selected chain) | 3173 authored frontend lines vs HEAD (see chain facts) |
| C9 | Clear-bought omits household guard | CLOSED | Carried over (`never deletes a foreign-household bought article…` green) |
| **W6** | Shopping hooks relabel the shared household error object in place | **CLOSED** | Probe + helper mutation above: exactly L:374 and A:768 fail under the in-place form; candidate passes; identity and `tipo` of the shared object untouched |

## Mutation checks this run (all restored; hashes re-verified; `git status` identical)

| # | Target | Mutation | Focused result | Full-suite result | After restore |
|---|---|---|---|---|---|
| W6-M | `fallo.ts:5-11` | body → `Object.assign(causa instanceof Error ? causa : new Error(String(causa)), { tipo })` | probe 1 failed (`sameObjectL/A: true`) | **3 failed / 217 passed (220 incl. probe)**: probe + L:374 + A:768 only | probe deleted; L 13/13, A 22/22; 219/219 |
| M1 (spot-check) | `useListas.ts:83` | drop `alcanceActual.current !== alcance` from `crear` | L 1 failed / 12 passed (`rejects a retained A callback…`) | — | L 13/13 |
| M7 (spot-check) | `hogar-contexto.tsx:50` (`estadoVisible`, L:46-54) | `estadoVisible` ignores session identity | HC 2 failed / 5 passed (both render-observation rows) | — | HC 7/7 |
| Probe (W6) | throwaway `src/__verify_probe_w6.test.tsx` | second `useHogar()` consumer after both hooks render under a `configuracion` error | **passes** on the candidate (`hogar: 'configuracion'`, distinct objects, `cause` links back) | — | file removed; status identical |

Restore proof: `useListas.ts` `59642a2b…`, `hogar-contexto.tsx` `026487cb…`, `fallo.ts` `bbb7959d…`, `useArticulos.ts` `71b22741…` re-hashed after restore; `rg MUTATION|__verify_probe src/` empty; `git status --porcelain` diff empty against the pre-verification snapshot.

## Tasks, TDD compliance and assertion audit

**Completeness**: 37 rows in `tasks.md`, 37 `[x]`, 0 unchecked (35 baseline + section 7 RED/GREEN). Both section-7 rows map onto the two new cases and the helper; the GREEN row's "helper not exported from the module barrel" is confirmed by `index.ts` and X.

### TDD Compliance
| Check | Result | Details |
|---|---|---|
| TDD evidence reported | ✅ | Per-row RED/GREEN/REFACTOR table in the section-7 apply-progress block, plus the writer's own mutation check (2 failed / 217 passed) which I reproduced |
| All tasks have tests | ✅ | 7/7 test files for the 7 production files (+ `index.test.ts`); `fallo.ts` is covered through L/A (all four `tipo` paths) rather than a dedicated unit file — acceptable for a private 11-line helper |
| RED confirmed | ✅ | W6-M reproduces the recorded RED text verbatim on both cases; M1/M7 re-confirm C2/C1 RED texts; W1 disclosure unchanged |
| GREEN confirmed | ✅ | 219/219; focused L 13, A 22, HC 7 (HR 6, HB 9, RT 24, X 1 green inside the full run) |
| Triangulation adequate | ✅ | The new `configuracion` cases pair with the existing `realtime`-cause cases (L:345, A:734: same mapping line, different cause type) and with the `persistence`/`validation` cases that exercise the other helper labels; expectations differ (`'configuracion'` preserved vs `'realtime'` exposed) |
| Safety net for modified files | ✅ | 33/33 recorded before the section-7 edits (L 12, A 21) and reproduced by my per-file counts minus the new cases |

**TDD Compliance**: 6/6 checks passed (with the W1 disclosure carried over).

### Test layer distribution (change-related files)
| Layer | Tests | Files | Tools |
|---|---|---|---|
| Unit | 7 | 2 (HR, X) | Vitest 4 |
| Integration (React, `renderHook`/`render`) | 51 | 4 (HC 7, HB 9, L 13, A 22) | Vitest 4 + Testing Library, jsdom |
| Integration (collections + fake socket, no React) | 24 | 1 (RT) | Vitest 4 |
| E2E | 0 | 0 | not installed |
| **Total** | **82** | **7** | |

### Changed file coverage
Coverage analysis skipped — no coverage tool detected.

### Assertion quality
The two new cases assert real behavior: the load-bearing line is `expect(errorHogar.tipo).toBe('configuracion')` **after** the render (fails on the in-place form), backed by an identity assertion (`not.toBe`) and a value assertion (`toMatchObject` on `tipo`, `message`, `cause`). The baseline observation that the L:345/A:734 cases "cannot distinguish pass-through from relabeling" is resolved by these companions. No tautologies, orphan empty checks, ghost loops or smoke-only tests were introduced; the carried-over findings (W3 title, W5 mock count) stand.

**Assertion quality**: 0 CRITICAL, 2 WARNING (W3, W5 — carried over).

### Quality metrics
**Linter**: ✅ No errors · **Type checker**: ✅ No errors · **Formatter**: ✅ Clean · **Build**: ✅ (chunk-size warning pre-existing)

## Design coherence (carried over; one row added)

The baseline table stands unchanged: the section-7 unit touches only the private error-construction helper and the two hooks' import lines. Added row:

| Decision | Followed? | Notes |
|---|---|---|
| Section-3 REFACTOR row: shared private helpers instead of duplicated bodies | ✅ | The two identical `fallo` bodies are now one generic helper in `application/fallo.ts`; it imports nothing (no cycle) and is not part of the public barrel |
| Design: shopping error "carries `tipo` and `causa`" | ✅ | The helper keeps `message` and sets `cause` (native `Error` option) on the new object; the household discriminator survives on the original |

## Issues

**CRITICAL**: None.

**WARNING** (5 open, all carried over from the baseline; none moved)
- W1: HC `drops an in-flight resolution once the provider unmounts` passes without the cleanup `generacion.current++` (writer-disclosed). It pins the contract but does not prove that line.
- W2: No runtime test asserts the complete return key set of `useListas()` / `useArticulos()` or the absence of handles (H2-S1, S1-S1 PARTIAL). Static evidence only (`tsc` + barrel test).
- W3: HB `does not leak a deferred setup after unmount and forwards connection failure` — the body proves the deferred-setup teardown only; the title overstates coverage.
- W4: (a) `renombrar` of a current list with an invalid name is not exercised (S3-S1 PARTIAL); (b) the `error`-state non-mount branch is proven with a realtime cause, not a configuration cause (H1-S3 COMPLETE because the branch is cause-independent); (c) B's projection contents after an A→B transition are not asserted (S7-S1 PARTIAL).
- W5: HB uses six module mocks (disclosed as lifecycle-integration necessity).
- ~~W6~~ **CLOSED** — see the W6 closure section.

**SUGGESTION**
- S1: `useArticulos` `ordenar` re-sorts the domain-ordered array with a comparator that restates the domain rule plus an ID tiebreaker; a single comparator in `domain/articulo.ts` would remove the duplication.
- S2: The module-level cleanup queue in `hogar-listas.tsx` has no timeout; a hung `detener()` blocks every later boundary setup (documented by the writer).
- S3: After an action attempted in the `error` state, the hook's public `error` becomes that attempt's `validation` failure (writer-disclosed); consider keeping the household error dominant while the provider is not ready.
- S4 (writer's follow-up, assessed): `shared/hogar/hogar-repository.ts` `errorHogar()` (L:27-30) and `application/hogar-listas.tsx` `errorRealtime()` (L:27-30) keep the in-place `Object.assign(causa, { tipo })` form. Assessed cause by cause: `errorHogar` receives (i) the SDK `error` object of a single PostgREST response (fresh per request, held by no other consumer), (ii) string literals (`new Error(...)`, fresh), or (iii) in the `catch`, an error already thrown by `errorHogar('consulta', …)` inside the same `try` (relabeled with the same `consulta` value — idempotent; the `configuracion` branch `return`s rather than throws, so it never reaches the `catch`). `errorRealtime` receives the socket `connect_error` payload or the `subscribe` rejection, both fresh per event and consumed only by `alError`. No shared object flows into either, so there is no cross-consumer symptom: SUGGESTION, not WARNING. Aligning both on the `fallo`-style copy would make the invariant uniform and remove the reasoning burden.
- S5 (W6 residual, demoted): both hooks label every household error `realtime`; a `consulta` household error is exposed with `tipo: 'realtime'` and `cause.tipo: 'consulta'`. The hook's `query` type is unused for household read failures. Not prescribed by spec or design; decide before UI consumes `error.tipo` from the shopping hooks.

## Size fact and chain-slice viability (for the chain planner; not a verdict input)

Authored frontend candidate vs HEAD: tracked `query.tsx` 5/1, `index.ts` 6/13, `realtime.ts` 92/24, `realtime.test.ts` 150/4 (= 295) plus 12 untracked files totaling 2878 lines = **3173 changed lines** (baseline 3132; the section-7 unit's churn was 61 = 51 additions + 10 deletions, but the 10 deletions fell inside untracked files, so the HEAD-relative count grows by 41: `useListas.test.tsx` 392, `useArticulos.test.tsx` 786, `useListas.ts` 162, `useArticulos.ts` 292, `fallo.ts` 11). OpenSpec artifacts and the unrelated `.atl/` change are excluded.

Import graph delta: `application/fallo.ts` has **no imports** and is imported only by `useListas.ts` and `useArticulos.ts` (verified with `rg`); nothing under `shared/`, `hogar-listas.tsx`, `realtime.ts`, `index.ts` or the HB/HC/HR/RT/X tests references it. It therefore belongs to PR 2 by import graph, and PR 1 stays independently green without it. The remaining edges are as recorded in the baseline.

| Slice (user-selected `stacked-to-main`) | Files | Authored lines | Independently green? |
|---|---|---|---|
| PR 1 household resolution + realtime lifecycle | `hogar-repository.ts/.test` (271), `hogar-contexto.tsx/.test` (349), `realtime.ts/.test` diff (270), `hogar-listas.tsx/.test` (608), `query.tsx` diff (6) | **1504** (unchanged) | Yes: no file imports the hooks, the barrel or `fallo.ts`; HR/HC/HB/RT are self-contained. `query.tsx` must ship here (it imports `HogarListas`). `index.ts` stays at HEAD (`export {}`) |
| PR 2 list/article hooks + rollback | `useListas.ts/.test` (554), `useArticulos.ts/.test` (1078), `fallo.ts` (11) | **1643** (was 1602) | Yes on top of PR 1 (all seams are PR 1 modules or existing infrastructure). `useArticulos` depends on `useListas` types; if split, `fallo.ts` ships with 2a (`useListas`) and 2b follows |
| PR 3 public exports + regression | `index.ts` diff (19), `index.test.ts` (7) | **26** (unchanged) | Yes on top of PR 2 |

Sum 1504 + 1643 + 26 = 3173. PR 1 and PR 2 each exceed the 400/600-line budgets by a wide margin; both admit the further split recorded in the baseline (PR 1a `shared/hogar/*` 620 → PR 1b 884; PR 2a `useListas` + `fallo.ts` 565 → PR 2b `useArticulos` 1078). Slices were assessed by import-graph inspection, not by physically stashing files (read-only mandate).

## Verdict

**PASS WITH WARNINGS** — 0 CRITICAL, 5 WARNING (W1–W5, all carried over), 5 SUGGESTION (S1–S5). W6 is closed with independently reproduced, load-bearing runtime evidence (helper mutation → exactly the two new cases fail, 217 stay green; the original cross-consumer probe passes on the candidate). C1–C7 and C9 remain closed (M1 and M7 re-confirmed on the final candidate); C8 is a size fact under the user-selected chain. Nothing blocks archive. Next: `sdd-archive`.
