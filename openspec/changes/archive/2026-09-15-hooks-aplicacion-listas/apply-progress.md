# Apply Progress: Household and Shopping Application Hooks

## Status

- Consumed authoritative `gentle-ai.sdd-status` v2: `applyState: ready`, repo-local workspace `/Users/cmotero/repos/ADuo`, with that workspace as the only allowed edit root.
- Resumed the authorized `full-hooks-implementation` attempt with token `sha256:3920d6561a5c7da98c8cb0e8091ee92e6fbbcfe7af57509aedd11efb13d3596d`; the acquire response was `proceed`.
- Strict TDD is active from `openspec/config.yaml`; the global strict-TDD module was read. The project-local override does not exist.
- The active attempt permits 850 changed lines under the explicit size exception. No commit was created.
- The interrupted attempt was settled with the original plus newly authored untracked paths explicitly selected; settlement returned `proceed`.

## In-progress work

Started the first household-resolution cycle; no checklist row is complete yet because the task's required coverage (household/member read failures and full Strict Mode cases) is not complete.

Files added:

- `frontend/src/shared/hogar/hogar-repository.ts`
- `frontend/src/shared/hogar/hogar-repository.test.ts`
- `frontend/src/shared/hogar/hogar-contexto.tsx`
- `frontend/src/shared/hogar/hogar-contexto.test.tsx`

Implemented so far:

- `resolverHogar(userId)` reads up to two memberships, distinguishes zero/multiple membership results, loads the sole household and its members, maps public types, and normalizes query/configuration errors.
- `HogarProvider` exposes the discriminated public `useHogar` state and suppresses late results with a generation guard.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1 RED/GREEN (in progress) | `shared/hogar/hogar-repository.test.ts`, `shared/hogar/hogar-contexto.test.tsx` | Integration | N/A (new files) | Missing production-module imports failed as expected | Focused suite passed after minimum repository/context implementation | Added zero/multiple and membership-error cases; remaining required cases pending | Private error and resolution helpers added; task remains incomplete |

## Verification

- `cd frontend && pnpm test -- src/shared/hogar/hogar-repository.test.ts src/shared/hogar/hogar-contexto.test.tsx` — passed: 24 files, 159 tests.
- `cd frontend && pnpm exec tsc --noEmit` — passed.

## Deviations and risks

- No deviation from the proposed public state model or shared/module boundary has been made.
- The focused Vitest invocation currently runs the whole configured suite, not only the requested files; it passed despite jsdom's existing `Window.scrollTo()` notices.
- Existing unrelated worktree changes in `.atl/` and an untracked materialization path were preserved untouched.

## Remaining implementation tasks

- [ ] **RED** — Add `frontend/src/shared/hogar/hogar-repository.test.ts` and `frontend/src/shared/hogar/hogar-contexto.test.tsx` cases for one, zero, and multiple memberships; membership/household/member read errors; session replacement; scoped member data; and late-read suppression, mocking only `@/shared/api/insforge` and exercising the public `useHogar` contract.
- [ ] **GREEN** — Create `frontend/src/shared/hogar/hogar-repository.ts` and `frontend/src/shared/hogar/hogar-contexto.tsx` with the specified bounded resolution, discriminated public state, generation guards, and no raw SDK exposure.
- [ ] **TRIANGULATE** — Extend household-context tests with React Strict Mode and sign-out/household-A→B cases.
- [ ] **REFACTOR** — Consolidate household mapping, error normalization, and generation cleanup helpers.
- [ ] **RED** — Add realtime lifecycle failure, channel, abort, idempotence, and old-generation unsubscribe tests.
- [ ] **GREEN** — Harden `frontend/src/modules/listas/infrastructure/realtime.ts` with handler-first setup, cancellation, checks, filtering, and serialized disposal.
- [ ] **RED** — Add injected shopping-resource-boundary lifecycle tests.
- [ ] **GREEN** — Create `frontend/src/modules/listas/application/hogar-listas.tsx` and compose the injected boundary.
- [ ] **TRIANGULATE** — Add deferred setup, unmount, reconnect, and query-key reuse boundary tests.
- [ ] **REFACTOR** — Extract private resource scope-generation and teardown helpers.
- [ ] **RED** — Add `useListas` filtering, ordering, validation, optimistic success/rollback, child-visibility, and lifecycle tests.
- [ ] **GREEN** — Create `useListas` derived projection and typed optimistic actions.
- [ ] **RED** — Add `useArticulos` scoped ordering, validation, rollback, echo, and partial-clear tests.
- [ ] **GREEN** — Create `useArticulos` derived projection and typed actions.
- [ ] **TRIANGULATE** — Add list/article concurrent realtime, stale callback, malformed-ID, and parent-rollback tests.
- [ ] **REFACTOR** — Factor private application result, scope, transaction, and ordering helpers.
- [ ] **RED** — Add public barrel contract checks.
- [ ] **GREEN** — Export intended hooks/types and update provider composition as needed.
- [ ] **REFACTOR** — Remove duplicate fixtures, tighten public types, and run full tests, typecheck, lint, and formatting checks.

## Workload boundary

The active work unit remains the authorized `full-hooks-implementation` single-PR size exception with an 850-line maximum. The first task is intentionally not marked complete until its listed Strict TDD coverage is complete.

## Resume evidence — 2026-09-13

- Resumed the audited-reset attempt using token `sha256:a2ac1a63bba6838b3a861af6105a4142f439d22ed49d7e015b03a7278425736d`; acquire returned `proceed` under the explicit single-PR `size:exception` and 850-line cap.
- Read the proposal, both specifications, design, tasks, previous progress, strict-TDD guidance, and current InsForge realtime documentation before editing.
- Preserved unrelated `.atl/.skill-registry.cache.json` and `.atl/skill-registry.md` changes untouched; no commit was created.

### Implemented candidate (not yet checklist-complete)

- Completed the public export RED/GREEN rows and persisted their checkboxes: `modules/listas/index.test.ts` asserts the two-hook runtime surface; `modules/listas/index.ts` exports only hooks plus type-only public contracts; `AppProviders` composes `SesionProvider → HogarProvider → HogarListas`.
- Added the private household-list resource boundary, `useListas`, and `useArticulos` candidate implementations. They keep collections internal, use live projections, await transaction persistence, filter by household/list scope, provide typed errors/results, and keep list children invisible when their parent is removed.
- Hardened realtime setup with handler-first registration, subscribe-result rejection, `connect_error` reporting, an optional abort signal, serialized unsubscribe, and idempotent async teardown.
- Expanded household read-error tests and added RED/GREEN tests for realtime setup, the resource boundary, unavailable hook actions, and public exports.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| Household partial | `shared/hogar/hogar-repository.test.ts`, `hogar-contexto.test.tsx` | Integration | 159 baseline tests | Existing missing-module RED was retained; added read-error cases | Focused suite: 161 passing | Multiple membership/read-error/session cases exist, but required Strict Mode/sign-out coverage is incomplete | Mapping/error helpers remain private |
| Realtime partial | `modules/listas/infrastructure/realtime.test.ts` | Integration | Existing realtime suite | Handler-order and failed-subscribe tests failed (2 failures) | 163 passing after lifecycle hardening | Required channel/abort/old-generation cases remain missing | Serialized queue and teardown helper added |
| Resource boundary partial | `modules/listas/application/hogar-listas.test.tsx` | Integration | N/A (new) | Missing module import failed | 164 passing after boundary implementation | Strict Mode/lifecycle-error/A→B cases remain missing | Abort/cleanup helpers extracted |
| List/article hooks partial | `useListas.test.tsx`, `useArticulos.test.tsx` | Integration | N/A (new) | Missing module imports failed | 165/166 passing after hooks were added | Required optimistic, rollback, and filtering cases remain missing | Shared result/order helpers are private |
| Public exports | `modules/listas/index.test.ts` | Unit | N/A (new) | Empty barrel failed (expected hooks, received none) | 167 passing after exports/composition | Structural contract; triangulation is not applicable | No further change needed |

### Verification

- `cd frontend && pnpm test` — passed: 28 files, 167 tests.
- `cd frontend && pnpm exec tsc --noEmit` — passed.
- `cd frontend && pnpm lint` — passed.
- `cd frontend && pnpm check` — passed.

### Remaining unchecked implementation rows

The persisted `tasks.md` remains authoritative. The following exact rows are intentionally still unchecked because their specified Strict-TDD coverage has not yet been evidenced: household RED/GREEN/TRIANGULATE/REFACTOR; realtime RED/GREEN; resource-boundary RED/GREEN/TRIANGULATE/REFACTOR; list/article RED/GREEN/TRIANGULATE/REFACTOR; and public-composition REFACTOR. The only completed persisted rows are the public-export RED and GREEN rows above.

### Workload / risks

- Delivery is the authorized single-PR `size:exception`; no chaining decision was inferred.
- The candidate is not ready for `sdd-verify`: 17 implementation-owned rows remain unchecked, principally because the high-scope behavior tests required by Strict TDD were not completed.
- The realtime candidate has no custom self-echo deduplication and does not disconnect the shared SDK socket, but its required mismatched-channel test/guard must be completed before considering its task done.

### Runtime settlement

- The resumed attempt was recorded as `failed` with evidence revision `sha256:c6230b817ec6aa8730cb4894c0fe291421e3b67482f58e097cd92f30afda4aac`; the persisted runtime status reports 910 changed lines against the 850-line cap and requires a maintainer decision/reset at revision `sha256:77903ca4cd60005dd29be05c4ff4d5dc28e3f000ba73aee0e3b2328fdf7498c0` before another apply attempt.
- This historic stop was resolved by the user-authorized 1500-line reset recorded in the active runtime status.

## Completion evidence — 2026-09-13

- Consumed authoritative status `applyState: ready` with repo-local action context and `/Users/cmotero/repos/ADuo` as the sole edit root. Continued active attempt `sha256:d0942a62527fdc0a7eddec198466747f1a3cfe414f40f679e99fc4afc5d768a1` after acquire returned `proceed` for request `apply-hooks-6c0a4150292f46c9ac8c7dd4509774fe`.
- Strict TDD remained active. All 17 previously unchecked implementation rows are now visibly `[x]` in `tasks.md`; the completed public-export rows remain unchanged.

### Completed implementation

- Household coverage exercises sign-out clearing, Strict Mode replay, A→B replacement, and late-result rejection.
- Realtime filters foreign-channel events while retaining handler-first setup, abort cleanup, error reporting, serialized teardown, and idempotent disposal.
- The resource boundary serializes scope cleanup, cancels/removes retired household query keys, rejects aborted/deferred setup publication, and guards lifecycle callbacks by generation.
- List projections filter by household before deterministic ordering and reject retained old-scope callbacks; list and article tests cover validation, persistence outcomes, partial clear-bought results, and parent-child visibility.

### TDD Cycle Evidence

| Task rows | Test files | Layer | RED | GREEN / TRIANGULATE / REFACTOR evidence |
|---|---|---|---|---|
| Household RED–REFACTOR | `shared/hogar/hogar-repository.test.ts`, `shared/hogar/hogar-contexto.test.tsx` | Integration | Existing missing-module RED plus new Strict Mode/sign-out/late-read cases | Focused household suite green; mapping/error/generation helpers remain private |
| Realtime RED–GREEN | `modules/listas/infrastructure/realtime.test.ts` | Integration | Foreign-channel message wrote a list (170 tests, 1 failure) | Channel guard added; focused realtime green with abort and old-generation cases |
| Resource boundary RED–REFACTOR | `modules/listas/application/hogar-listas.test.tsx` | Integration | A→B cleanup/deferred setup cases failed (174 tests, 3 failures) | Serialized cleanup and generation guards; focused lifecycle suite green |
| Lists RED–REFACTOR | `modules/listas/application/useListas.test.tsx` | Integration | Foreign-household list appeared in projection (177 tests, 1 failure) | Household filter and stale-scope guard added; focused list suite green |
| Articles RED–REFACTOR | `modules/listas/application/useArticulos.test.tsx` | Integration | Existing import RED retained; expanded scoped ordering, validation, mutation, and partial-clear cases | Focused hooks suite green; private result/order helpers remain non-public |
| Public composition REFACTOR | `modules/listas/index.test.ts` and full suite | Unit/integration | Existing public-contract approval test green | Prettier refactor followed by focused and full green suite; no raw handles exported |

### Final verification

- `cd frontend && pnpm test -- src/shared/hogar/hogar-repository.test.ts src/shared/hogar/hogar-contexto.test.tsx src/modules/listas/infrastructure/realtime.test.ts src/modules/listas/application/hogar-listas.test.tsx src/modules/listas/application/useListas.test.tsx src/modules/listas/application/useArticulos.test.tsx` — passed: 28 files, 184 tests.
- `cd frontend && pnpm exec tsc --noEmit` — passed.
- `cd frontend && pnpm lint` — passed.
- `cd frontend && pnpm check` — passed.
- `cd frontend && pnpm test` — passed: 28 files, 184 tests.

### Workload / risk boundary

- Authorized delivery is the explicit single-PR `size:exception` at the 1500-line cap. No commit was created.
- `.atl/.skill-registry.cache.json` and `.atl/skill-registry.md` were preserved untouched.
- All implementation-owned tasks are persisted as complete; the change is ready for `sdd-verify` after runtime settlement.

## Hook-layer verification remediation — 2026-09-15

Scope of this work unit: `frontend/src/modules/listas/application/useListas.ts`,
`useArticulos.ts`, `useListas.test.tsx` and `useArticulos.test.tsx` only. It
closes verify blockers **C6 (hook layer), C2, C3 and C9**. C1, C4 and C5 belong
to the household-context/resource-boundary/realtime work unit and were not
touched here. Every claim in the earlier completion tables that concerns these
four files is superseded by the evidence below; nothing above is restated.

### What changed

- **C6 — harness.** Both hook test files no longer mock `@tanstack/react-db` and
  no longer fake `useRecursosListas` with inert collection stubs. They build the
  real `crearListasCollection` / `crearArticulosCollection` and mock only the
  PostgREST repositories (`listasRepository`, `articulosRepository`), following
  the setup idiom of `infrastructure/realtime.test.ts`. `useArticulos.test.tsx`
  additionally backs those repository mocks with a small in-memory table pair, so
  the refetch the collection replays after every mutation handler reflects the
  write that just succeeded — without it a successful delete would be resurrected
  by the next server read and no rollback assertion would mean anything.
- **C2 — generation-safe actions and errors.** Both hooks now derive an
  `alcance` (scope identity: household for `useListas`, household + `listaId` for
  `useArticulos`), hold it in a render-updated ref, and capture it in every action
  callback. An action whose captured scope is no longer current refuses to mutate,
  and all error reporting goes through a `reportar(generacion, error?)` helper that
  drops reports from a stale scope. A successful action now clears the previous
  error via the same helper. The triplicated `try`/`catch` was folded into one
  generic `persistir(generacion, transaccion, valor)` helper per hook.
- **C3 — reactive parent visibility.** `useArticulos` replaced the imperative
  `recursos.listas.get(listaId)` read with a second `useLiveQuery` over the
  `listas` collection (`consultaListas.state?.get(listaId)`), so a separately
  mounted article consumer re-renders when its parent list is optimistically
  deleted and again when that deletion rolls back.
- **C9 — clear-bought household guard.** A single `enAlcance` predicate now backs
  the public projection, `actual()` and the `limpiarComprados` selection, so a
  record invisible to the consumer can never be reachable by a write.

### TDD cycle evidence (per row)

| Row | Behaviour | RED (observed failure) | GREEN |
|---|---|---|---|
| HARNESS | Non-behavioural conversion onto real collections | N/A — refactor row; safety net `pnpm exec vitest run src/modules/listas/application/useListas.test.tsx src/modules/listas/application/useArticulos.test.tsx` captured **10 passing** before the change and the same 10 cases passed after it | 10/10 green against real projections |
| C6 RED/GREEN | Optimistic create/add pending + server-echo convergence; failed edit/mark/unmark/single-delete rollback; mixed and empty `limpiarComprados`; tie ordering; realtime-vs-rollback ordering | **No production defect found.** 12 new cases were added on the real harness and passed without a production change: the optimistic/rollback semantics existed, only the evidence was missing. The two tie-ordering cases DID fail first as written and were rewritten: a mutation run proved the original version passed with `a.id.localeCompare(b.id)` deleted, because the collection already yields tied records in codepoint order. They now use mixed-case IDs (`a`, `B`, `c`) and fail under that exact mutation | 31/31 green in the two files |
| C2 RED | Retained stale actions and late errors | 4 failures: retained `lista-1` `agregar` returned `{ok:true}` and wrote to the old list after the hook moved to `lista-2`; retained household-A `editar` returned `{ok:true}` after B became current; a late A failure replaced B's `validation` error with `persistence`; a successful action left the previous error in place (`expected Error: nombre-vacio to be undefined`) | — |
| C2 GREEN | `alcance` guard + scoped `reportar` | — | all 4 pass; `insertarArticulo`/`actualizarArticulo`/`eliminarArticulo` prove no stale write reached persistence |
| C3 RED | Reactive parent visibility (S5) | 2 failures: with a parent deletion pending, the separately mounted consumer still projected `['a','b']` instead of `[]`, for both the pending case and the rollback case | — |
| C3 GREEN | Live parent query | — | both pass; child subtree hides on pending parent delete and is fully restored on rollback, with `eliminarArticulo` never called |
| C9 RED | Foreign-household bought row sharing the list ID | 1 failure: `successfulIds` was `['ajeno', 'propio']` — the invisible foreign-household row was selected and deleted | — |
| C9 GREEN | Shared `enAlcance` guard | — | passes; exactly one delete (`'propio'`), and the foreign row survives in the fake server table |

### Verification (in the mandated order)

| Command | Exit |
|---|---|
| `cd frontend && pnpm test -- src/modules/listas/application/useListas.test.tsx src/modules/listas/application/useArticulos.test.tsx` | 0 — 28 files, 205 tests passed (the package wrapper does not restrict the run) |
| `cd frontend && pnpm test` | 0 — 28 files, 205 tests passed (baseline was 184) |
| `cd frontend && pnpm exec tsc --noEmit` | 0 |
| `cd frontend && pnpm lint` | 0 |
| `cd frontend && pnpm check` | 0 |

### Candidate size (C8 — reported, not acted on)

Frontend tracked diff is 168 additions + 42 deletions; the 11 untracked frontend
files now total 2279 lines, so the authored frontend candidate is **2489 changed
lines** against the authorized 1500-line cap — **989 over**. The four files in
this work unit account for 1539 of those lines (`useArticulos.test.tsx` 733,
`useArticulos.ts` 296, `useListas.test.tsx` 344, `useListas.ts` 166); the growth
is behavioural test coverage the verify report required. No chaining, split,
commit, PR or archive decision was made here.

### Rollback boundary

Reverting the four files above restores the previous hook candidate without
touching household context, the resource boundary or realtime.

## Boundary/realtime verification remediation — 2026-09-15

Scope of this work unit: `frontend/src/shared/hogar/hogar-contexto.tsx`,
`hogar-contexto.test.tsx`, `hogar-repository.ts`, `hogar-repository.test.ts`,
`frontend/src/modules/listas/application/hogar-listas.tsx`,
`hogar-listas.test.tsx`, `frontend/src/modules/listas/infrastructure/realtime.ts`
and `realtime.test.ts` only. It closes verify blockers **C1, C4 and C5** plus the
three assertion WARNINGs (HB Strict Mode, RT handler order, HR read errors) and
the `todosLosMiembros` pagination WARNING. The four hook-layer files of the
previous section were not touched. `frontend/src/app/providers/query.tsx` was
NOT touched: the cleanup-queue ownership moved to module level inside
`hogar-listas.tsx` (same precedent as `realtime.ts`'s channel queue), so the
composition did not need to change. Every claim in earlier sections that
concerns these eight files is superseded by the evidence below.

### What changed

- **C1 — synchronous session mask.** `HogarProvider` now stores the resolved
  state together with the session identity it was resolved for
  (`{ sesion, estado }`) and compares that identity to the current session
  DURING render (`estadoVisible`), so the render in which the session has
  already changed (or signed out) already exposes `loading` before any effect
  runs. The effect discards the stored result on an absent session, and its
  cleanup bumps the generation so an in-flight resolution of an unmounted
  provider is retired. The `loading | ready | sin-hogar | error` public
  contract is unchanged.
- **C4 — retirement ownership.** The cleanup queue in `hogar-listas.tsx` is
  now module-owned (`colaLimpieza` / `encolarLimpieza`), so it survives
  `HogarProvider` unmounting and recreating the boundary on session
  loading/error. Teardown first awaits the generation's own in-flight setup
  promise (`instalacion`, which never rejects and resolves with whatever the
  generation acquired) and only then runs `limpiarScope` in reverse
  acquisition order: subscription → collections → cancel + remove query keys.
  A preload that settles after the abort is therefore always followed by the
  key removal, and a subscription that resolves after the abort is stopped
  before the collections are released.
- **C5 — envelope and signal gates.** `realtime.ts` reads `meta.channel`
  through `canalDelMensaje(unknown)`, which narrows from `unknown` instead of
  trusting the SDK shape, so a null/missing `meta` reaches `filaDesdeMensaje`
  and is reported as `mensaje-ilegible` and dropped rather than thrown from
  the channel filter. `soloCanal` also gates every data handler on the setup
  `AbortSignal`: once the owner aborts, events are ignored even while the
  handlers are still registered.
- **Pagination.** `todosLosMiembros` now reads members in `order('id')` +
  `range(desde, desde + 99)` windows of `MIEMBROS_POR_PAGINA = 100` until a
  short page, so member retrieval is complete regardless of PostgREST's
  `max-rows` (implemented, not just documented; the code comment records why).

### TDD cycle evidence (per row)

| Row | Test (file › name) | RED (observed failure text) | GREEN | Mutation check |
|---|---|---|---|---|
| C1 RED/GREEN | HC › `never lets a child render observe the previous household during a different session` / `… during sign-out` (render-log probe `Registro`) | `AssertionError: expected [ 'ready', 'loading' ] to deeply equal [ 'loading', 'loading' ]` — the child observed household A on the session-change render, then loading after the effect | 7/7 HC pass after `estadoVisible` mask | Mask disabled (`return almacenada`): both rows fail (`expected [ 'ready' ] to deeply equal [ 'loading' ]`, `[ 'ready', 'loading' ] …`). Restored. |
| C1 RED (unmount) | HC › `drops an in-flight resolution once the provider unmounts` | **Passed on first run.** Not load-bearing: with the cleanup `generacion.current++` removed it still passes, because React 19 silently drops a state update on an unmounted fiber. The line is defensive; the test pins the contract (no render, no `ready` after unmount) rather than proving that line. Disclosed, not hidden. | pass | Cleanup bump neutralized → still 7/7 (documented above). |
| HR WARNING | HR › `surfaces a failed household read as a query error while the other read succeeds` / `… members read …` (each row fails exactly one of the two parallel reads and asserts the message `household denied` / `members denied`) | Passed on first run — coverage gap, no production defect | pass | (b) household error check removed → only the household row fails; (c) member error check removed → only the members row fails. Restored. |
| Pagination RED/GREEN | HR › `reads every member across page boundaries instead of one bounded page` | `AssertionError: expected [ { id: 'm-0', …(3) }, …(99) ] to have a length of 101 but got 100` | 6/6 HR pass with the `range` loop | (a) loop stops after the first page → same failure text. Restored. |
| C5 RED/GREEN (null meta) | RT › `reports and drops an envelope with a null meta delivered through the registered handler` | `AssertionError: expected [Function] to not throw an error but 'TypeError: Cannot read properties of null (reading 'channel')' was thrown` | 24/24 RT pass with `canalDelMensaje` | (a) bare `mensaje.meta.channel` read restored → same TypeError failure. Restored. |
| C5 RED/GREEN (abort gate) | RT › `makes the registered handlers inert once the setup signal is aborted` | `AssertionError: expected { id: 'lista-tardia', …(10) } to be undefined` — the post-abort event wrote to the collection | pass with the `signal?.aborted` gate | (b) gate removed → same failure. Restored. |
| RT WARNING | RT › `registers every handler before starting the socket connection` now asserts all 8 registered event names and `max(on.invocationCallOrder) < connect` | Passed on first run — coverage gap | pass | (c) `connect_error` registered after `connect()` → `expected 187 to be less than 186`. Restored. |
| C4 RED/GREEN (deferred subscription) | HB › `stops a subscription that settles after unmount before it cleans the collections` | `AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times` — collections were released while the subscription setup was still pending | 8/8 HB pass | (a) teardown ignores `instalacion` → fails (plus 5 others). Restored. |
| C4 RED/GREEN (aborted preload) | HB › `removes the household cache again after an aborted preload settles` (preload mock seeds `['listas','hogar-1']` when it settles) | `AssertionError: expected [ { id: 'lista-tardia' } ] to be undefined` — stale records survived | pass | (a) as above → fails. Restored. |
| C4 RED/GREEN (real remount) | HB › `does not let a remounted boundary set up until the previous teardown finished` (real `HogarProvider recurso={HogarListas}` with `useSesion`/`resolverHogar` faked; session ready A → loading → ready A again while `detenerA` is pending) | `AssertionError: expected "vi.fn()" to be called 1 times, but got 2 times` — the recreated boundary subscribed while A's teardown was pending | pass | (b) setup no longer waits on the module queue → exactly this test fails with the same text. Restored. |
| HB WARNING | HB › `keeps exactly one active subscription after Strict Mode replays setup` now routes the realtime mock to the real `iniciarSuscripcionHogar` over an in-memory socket and asserts one registered handler per event (8 events), `subscribe` once with `household:hogar-1`, and after unmount zero handlers, `unsubscribe` once, no `disconnect` | Passed on first run — stronger assertion on existing behaviour | pass | (c) `detener()` skipped in teardown → this test fails (`expected "vi.fn()" to be called 1 times, but got 0 times`) together with 4 others. Restored. |

Every mutation was applied, run, and reverted from a backup; the restored
files were re-run green after each one.

### Work unit evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `cd frontend && pnpm test -- src/shared/hogar/hogar-contexto.test.tsx src/shared/hogar/hogar-repository.test.ts src/modules/listas/application/hogar-listas.test.tsx src/modules/listas/infrastructure/realtime.test.ts` — exit 0; 28 files / 214 tests (the package wrapper does not restrict the run); safety net before edits was 4 files / 36 tests in these files (HC 4, HR 5, HB 5, RT 22), now 7 + 6 + 8 + 24 = 45 |
| Runtime harness | Real `HogarProvider → HogarListas` composition and real `iniciarSuscripcionHogar` over an in-memory socket in HB; no further runtime boundary exists below the SDK mock |
| Rollback boundary | Revert the eight files above; hook-layer files, provider composition and repositories are untouched |

### Verification (in the mandated order)

| Command | Exit |
|---|---|
| `cd frontend && pnpm test -- src/shared/hogar/hogar-contexto.test.tsx src/shared/hogar/hogar-repository.test.ts src/modules/listas/application/hogar-listas.test.tsx src/modules/listas/infrastructure/realtime.test.ts` | 0 — 28 files, 214 tests |
| `cd frontend && pnpm test` | 0 — 28 files, 214 tests (baseline was 205) |
| `cd frontend && pnpm exec tsc --noEmit` | 0 (one intermediate run failed on `toSorted` under the project lib target; replaced with `[...].sort()`) |
| `cd frontend && pnpm lint` | 0 (one intermediate run flagged an `import()` type annotation and a shadowed name in HB; both fixed) |
| `cd frontend && pnpm check` | 0 |
| `cd frontend && pnpm build` | 0 |

### Candidate size (C8 — reported, not acted on)

Frontend tracked diff is 253 additions + 42 deletions (`query.tsx` 5/1 and
`index.ts` 6/13 unchanged from before; `realtime.ts` 92/24; `realtime.test.ts`
150/4); the 11 untracked frontend files now total 2709 lines. The authored
frontend candidate is **3004 changed lines** against the authorized 1500-line
cap — **1504 over** (the first writer measured 2489; this unit added 515, all
of it in the eight files above: 363 in the three untracked test files, 67 in
the three untracked source files, and 85 across `realtime.ts` /
`realtime.test.ts`). No chaining, split, commit, PR or archive decision was
made here.

### Deviations / notes

- The module-level cleanup queue means a teardown that never settles (a
  `detener()` whose unsubscribe hangs) blocks every later boundary setup. This
  is not a new failure mode: `realtime.ts`'s channel queue already blocks the
  next same-socket subscribe behind a hung unsubscribe.
- HB now carries six mocks (two collection factories, realtime, insforge,
  `useSesion`, `resolverHogar`); it is a lifecycle integration test and the
  extra three exist only so the real provider composition can be mounted.

## Realtime-error surfacing remediation — 2026-09-15 (C6-residual)

Scope: the two rows of `tasks.md` section 6, sourced from `verify-report.md`
evidence revision `sha256:b1118d4e…` (probes P1/P2). Strict TDD active
(`openspec/config.yaml` `strict_tdd: true`; global `strict-tdd.md` read).
Runtime attempt already acquired by the parent (`state: proceed`); no acquire
or settle issued here. No commit was created. Budget 400 changed lines.

### What changed

Three test files only. Production source is byte-identical to the verified
candidate (sha256 recorded before mutation and re-checked after restore:
`useListas.ts` `1250c791…`, `useArticulos.ts` `4522a2f1…`,
`hogar-contexto.tsx` `026487cb…`).

| File | Added | Case |
|---|---|---|
| `frontend/src/modules/listas/application/hogar-listas.test.tsx` | +66 / -2 (imports `act`, `useHogar`, `EstadoHogar`; `ProbeHogar` recorder; one case) | `exposes a realtime failure reported after ready as a household error without re-creating the boundary` — real `HogarProvider recurso={HogarListas}` composition; `iniciarSuscripcionHogar` captures the reporter and later emits `{ tipo: 'socket', causa: Error('socket dropped') }`; asserts `useHogar()` → `{ estado: 'error', error: { tipo: 'realtime', message: 'socket dropped' } }`, the consumer still renders and shows no household resources, and `resolverHogar` / `crearListasCollection` / `iniciarSuscripcionHogar` each stay at 1 call (no implicit restart, no replacement subscription) |
| `frontend/src/modules/listas/application/useListas.test.tsx` | +29 | `exposes a realtime household error with an empty, non-ready projection and refuses to write` — `useHogar` mocked as `estado: 'error'` with a `realtime` cause while the retained resource still holds `lista('a')`; asserts `listas: []`, `ready: false`, `loading: true`, `error.tipo === 'realtime'` with the cause message; `crear('Compra')` returns `{ ok: false, error: { tipo: 'validation' } }` and `insertarLista` is never called |
| `frontend/src/modules/listas/application/useArticulos.test.tsx` | +34 | same shape for `useArticulos('lista-1')` with a retained bought row; `agregar('Leche')` and `limpiarComprados()` both return typed validation failures; `insertarArticulo` / `eliminarArticulo` never called |

Authored size of this unit: **130 additions + 2 deletions = 132 changed
lines**. Public readiness field is `ready` (both hooks), asserted as such.

### TDD cycle evidence (per row)

| Row | Safety net | RED (mutation-proven) | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|
| 6 RED (a) HB | 39/39 in the three files before edits (HB 8, L 11, A 20) | Mutation P2: `reportarErrorRecurso` body replaced by a no-op → `AssertionError: expected { estado: 'ready', …(2) } to match object { estado: 'error', error: { …(2) } }` (`- "estado": "error"` / `+ "estado": "ready"`) | Restored source: 8/8 → 9/9 | Companion: `reports a failed preload without publishing a stale resource` (setup-time failure path, `alError` call) vs this post-ready reporter path | None needed |
| 6 RED (b) L | same | Mutation P1: `error: error ?? (hogar.estado === 'error' ? fallo('realtime', hogar.error) : undefined)` replaced by `error: error` → `AssertionError: expected { listas: [], loading: true, …(5) } to match object { listas: [], ready: false, …(2) }` (`- "error": { "message": "socket dropped", "tipo": "realtime" }` / `+ "error": undefined`) | Restored source: 11/11 → 12/12 | Companion non-empty projection: `projects only current-household lists in createdAt and ID order`; companion error type: `restores the previous list name when the rename persistence fails` (`persistence`) | None needed |
| 6 RED (b) A | same | Mutation P1 in `useArticulos.ts` (same replacement) → `AssertionError: expected { articulos: [], loading: true, …(8) } to match object { articulos: [], ready: false, …(2) }` (same `- error` / `+ "error": undefined` diff) | Restored source: 20/20 → 21/21 | Companion non-empty projection: `filters by active list and household and orders pending records before bought records`; companion `hides all child projections when the parent list is no longer current` (empty for a different reason) | None needed |
| 6 GREEN | — | — | **Source unchanged.** All three cases already pass against the verified candidate; the RED was proven only while the surfacing was disabled by mutation (P1 + P2 applied together: exactly the 3 new cases failed, the 39 pre-existing cases stayed green, i.e. the verifier's gap reproduced). Both mutations restored from scratchpad backups; hashes re-verified; no `MUTATION` marker remains | — | — |

Mutation run: `pnpm exec vitest run <3 files>` → `Test Files 3 failed (3)`,
`Tests 3 failed | 39 passed (42)`. Restore run: `Tests 42 passed (42)`.

### Work unit evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `cd frontend && pnpm exec vitest run src/modules/listas/application/hogar-listas.test.tsx src/modules/listas/application/useListas.test.tsx src/modules/listas/application/useArticulos.test.tsx` — exit 0; 3 files / 42 tests (39 before) |
| Runtime harness | HB case drives the real `HogarProvider → HogarListas → realtime reporter → alError → reportarErrorRecurso → useHogar` chain over the mocked `iniciarSuscripcionHogar`; no runtime boundary below the SDK mock |
| Rollback boundary | Revert the three test files; nothing else changed |

### Verification (in the mandated order)

| Command | Exit |
|---|---|
| `cd frontend && pnpm test` | 0 — 28 files, 217 tests (214 + 3) |
| `cd frontend && pnpm exec tsc --noEmit` | 0 |
| `cd frontend && pnpm lint` | 0 |
| `cd frontend && pnpm check` | 0 |

### Deviations / notes

- The HB case asserts "boundary not re-created" through effect-level counts
  (`crearListasCollection` and `iniciarSuscripcionHogar` at 1 call each) and
  "no implicit restart" through `resolverHogar` at 1 call. It does not assert
  that the children keep the same React instance: `HogarProvider` renders the
  boundary only while `ready`, so on `error` the boundary leaves the tree and
  React remounts the children at the new position. Pinning instance identity
  would require a production change outside this narrow remediation; the spec
  clause that matters (error exposed, no duplicate replacement subscription)
  is asserted directly.
- After an attempted action in the `error` state the hook's public `error`
  becomes the `validation` failure of that attempt (existing `reportar`
  behavior with an undefined scope); the cases assert the `realtime` error
  before the attempt and the typed failure returned by the attempt, and do
  not pin which error is shown afterwards.

## 2026-09-15 — Section 7: W6 remediation (shared error object mutated in place)

Mode: Strict TDD. Scope: `tasks.md` section 7 (2 rows). Attempt acquired by the parent (`state: proceed`); no acquire or settle issued here. Budget 200 changed lines; authored 61.

### TDD Cycle Evidence

| Row | RED (test first) | GREEN | REFACTOR |
|---|---|---|---|
| 7 RED | `useListas.test.tsx:374` and `useArticulos.test.tsx:768` `exposes a non-realtime household error as a new realtime error without relabeling the shared object` — `useHogar` mocked `{ estado: 'error', error: Object.assign(new Error('household id is not a uuid'), { tipo: 'configuracion' }) }`; asserts the household object keeps `tipo === 'configuracion'`, `result.current.error` is a different object (`not.toBe`), and it matches `{ tipo: 'realtime', message, cause: errorHogar }`. Focused run before any source change: **2 failed / 33 passed (35)**, both with `AssertionError: expected 'realtime' to be 'configuracion' // Object.is equality` (Expected `"configuracion"`, Received `"realtime"`) — the in-place-mutation symptom | — | — |
| 7 GREEN | (same cases) | New private helper `application/fallo.ts` (`fallo<T extends string>(tipo, causa): Error & { tipo: T }`) builds `new Error(mensaje, { cause: causa })` and assigns `tipo` on the new object only. Both hooks drop their local `fallo` and import it. Focused: **35 passed / 35**. `ErrorAplicacion` and `Resultado` unchanged; helper not exported from the module barrel | Dedupe of the two identical `fallo` bodies into the single helper (section-3 REFACTOR row asked for shared private helpers); generic over `tipo` so it imports nothing from the hooks and creates no cycle. Triangulation: the pre-existing `realtime`-error cases (L:345, A:734) and the `persistence`/`validation` cases exercise the other `tipo` paths through the same helper |

Safety net before edits: focused L+A **33/33** (L 12, A 21).

### Mutation check

Helper body restored to `const error = causa instanceof Error ? causa : new Error(String(causa)); return Object.assign(error, { tipo })` → full suite **2 failed / 217 passed (219)**, exactly the two new cases. Fix restored → **219/219**; `rg Object.assign src/modules/listas/application/fallo.ts` shows only the `new Error(...)` form.

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `cd frontend && pnpm exec vitest run src/modules/listas/application/useListas.test.tsx src/modules/listas/application/useArticulos.test.tsx` — exit 0; 2 files / 35 tests (33 before) |
| Runtime harness | N/A below the mocked `useHogar` seam — the hook's mapping is pure over the household state; the cases run the real `useLiveQuery` over real collections |
| Rollback boundary | Revert `fallo.ts`, the two import lines and the two test cases; the previous inline `fallo` bodies come back with them |

### Verification (in the mandated order)

| Command | Exit |
|---|---|
| `cd frontend && pnpm test` | 0 — 28 files, 219 tests (217 + 2) |
| `cd frontend && pnpm exec tsc --noEmit` | 0 |
| `cd frontend && pnpm lint` | 0 |
| `cd frontend && pnpm check` | 0 |

### Changed lines

`useListas.test.tsx` +19, `useArticulos.test.tsx` +19, `useListas.ts` +1/−5, `useArticulos.ts` +1/−5, `fallo.ts` +11 (new) = **61**.

### Deviations / notes

- `consulta` → `query` mapping (verifier's suggestion in W6) NOT applied: neither spec nor design prescribes it (design only says the error "carries tipo ... and causa"). Both hooks still label every household error `realtime`; the original discriminator is now reachable through `error.cause.tipo` without corrupting the shared object. Left as a follow-up product decision.
- `shared/hogar/hogar-repository.ts` `errorHogar()` uses the same `Object.assign(causa, { tipo })` form on its own caught errors. Out of scope (constraints limit edits to the two hooks and their tests); those causes are not shared objects, so there is no cross-consumer symptom there.
