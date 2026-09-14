# Apply Progress: infraestructura-datos-realtime

## Slice: Phase 1 — `listasRepository.ts` / `articulosRepository.ts` (PR 1 — task 043)

**Mode**: Strict TDD
**Status**: Phase 1 complete (9/9 tasks). Phases 2-4 not started (out of scope for this run).

### Completed Tasks

- [x] 1.1 RED `listasRepository.test.ts`: round-trip mapping preserves all 7 fields; write payload uses `name` not `nombre`
- [x] 1.2 RED same file: `obtenerListas` returns `Lista[]` with no `name`/`household_id`; `insertarLista` returns a `Lista`
- [x] 1.3 RED same file: `eliminarLista` hard-delete regression — no `deleted_at` filter, no filter beyond `id`
- [x] 1.4 RED `articulosRepository.test.ts`: round-trip mapping; unpurchased row → all-empty purchase fields; purchased row → fully populated purchase fields
- [x] 1.5 RED same file: `obtenerArticulos` returns `Articulo[]` with no `content`/`is_bought`/`list_id`; `insertarArticulo` returns an `Articulo`; write payload keyed by `content` not `contenido`
- [x] 1.6 RED same file: `eliminarArticulo` hard-delete regression — no `deleted_at` filter
- [x] 1.7 GREEN `listasRepository.ts`: `listaDesdeFila`, `filaDesdeLista`, `obtenerListas`, `insertarLista`, `actualizarLista`, `eliminarLista`
- [x] 1.8 GREEN `articulosRepository.ts`: `articuloDesdeFila`, `filaDesdeArticulo`, `obtenerArticulos`, `insertarArticulo`, `actualizarArticulo`, `eliminarArticulo`; tri-state passed through unchanged
- [x] 1.9 REFACTOR: confirmed no `deleted_at` reference in production code (only in comments documenting its absence, and in the regression-test assertion string); full suite and `tsc --noEmit` both clean

### Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `frontend/src/modules/listas/infrastructure/listasRepository.ts` | Created | `FilaLista` type, bidirectional mapping (`listaDesdeFila`/`filaDesdeLista`), and `obtenerListas`/`insertarLista`/`actualizarLista`/`eliminarLista` CRUD against `@/shared/api/insforge`. 94 lines. |
| `frontend/src/modules/listas/infrastructure/listasRepository.test.ts` | Created | Pure mapping tests (round trip, write-payload key), plus `vi.hoisted` + `vi.mock('@/shared/api/insforge')` fake PostgREST chain covering read/insert/update/delete, including the hard-delete regression and error-surfacing tests. 225 lines. |
| `frontend/src/modules/listas/infrastructure/articulosRepository.ts` | Created | `FilaArticulo` type, bidirectional mapping (`articuloDesdeFila`/`filaDesdeArticulo`) preserving the purchase tri-state unchanged, and `obtenerArticulos`/`insertarArticulo`/`actualizarArticulo`/`eliminarArticulo` CRUD. 112 lines. |
| `frontend/src/modules/listas/infrastructure/articulosRepository.test.ts` | Created | Pure mapping tests (round trip, tri-state unpurchased/purchased, write-payload key), plus the same fake-chain pattern covering CRUD, hard-delete regression, and error surfacing. 293 lines. |

### TDD Cycle Evidence

| Task | RED (observed failure) | GREEN | REFACTOR |
|------|------------------------|-------|----------|
| 1.1-1.3 (`listasRepository`) | `pnpm test -- listasRepository.test.ts` failed: `Failed to resolve import "./listasRepository"` (module did not exist) | Implemented `listasRepository.ts`; `pnpm test -- listasRepository.test.ts` → all tests pass | Confirmed no `deleted_at` reference; import boundary limited to `@/shared/api/insforge` + `../domain/lista` |
| 1.4-1.6 (`articulosRepository`) | `pnpm test -- listasRepository.test.ts articulosRepository.test.ts` failed: `Failed to resolve import "./articulosRepository"` (module did not exist) | Implemented `articulosRepository.ts`; combined run → all tests pass | Confirmed no `deleted_at` reference; import boundary limited to `@/shared/api/insforge` + `../domain/articulo` |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `cd frontend && pnpm test -- listasRepository.test.ts articulosRepository.test.ts` → 2 test files, 18 new tests, all pass |
| Runtime harness command/scenario and exact result | N/A — pure PostgREST mocks, no live backend in this change (per tasks.md's own Runtime Harness column for Unit 1) |
| Rollback boundary | Revert the 4 new files listed above; nothing else in the repo imports them yet |

### Full-Suite Verification

- `cd frontend && pnpm test` → **19 test files, 117 tests, all passing** (baseline was 17 files / 99 tests; +2 files / +18 tests, zero regressions)
- `cd frontend && pnpm exec tsc --noEmit` → clean, no errors

### Requirement/Scenario Coverage (listas-repository spec — 4/4 requirements, 8/8 scenarios)

| Requirement | Scenario | Test |
|---|---|---|
| Domain-typed CRUD surface | A create call returns a domain type | `insertarLista` / `insertarArticulo` "returns a … for a valid creation payload" |
| Domain-typed CRUD surface | A read call never exposes raw columns | `obtenerListas` / `obtenerArticulos` "returns …[] with no … keys" |
| Bidirectional row-domain mapping | A round trip preserves every field | `listaDesdeFila / filaDesdeLista` "round-trips every field" |
| Bidirectional row-domain mapping | An update payload uses table column names | `articuloDesdeFila / filaDesdeArticulo` "builds a write payload keyed by content, not contenido" |
| Exact preservation of the purchase tri-state | Unpurchased row maps to all-empty purchase fields | "maps an unpurchased row to all-empty purchase fields" |
| Exact preservation of the purchase tri-state | Purchased row maps to fully populated purchase fields | "maps a purchased row to fully populated purchase fields exactly as read" |
| Hard delete with no soft-delete filter | Deleting a list issues no soft-delete filter | `eliminarLista` "issues a hard delete with no soft-delete filter…" |
| Hard delete with no soft-delete filter | Deleting an item issues no soft-delete filter | `eliminarArticulo` "issues a hard delete with no soft-delete filter…" |

### Deviations from Design

- `actualizarLista` and `actualizarArticulo` have no dedicated RED task in tasks.md 1.1-1.6; the "update payload uses table column names" scenario is proven at the pure-function level (`filaDesdeLista`/`filaDesdeArticulo`) per the spec's exact wording, and `docs/03-Arquitectura.md` §6 exempts the network-calling edge of `infrastructure/` from dedicated unit tests. Both functions are still exercised by one additional test each (not required by tasks.md, added for defensive coverage) that confirms the returned value and the update payload/filter shape end-to-end through the mocked chain.
- Added one error-surfacing test per repository (read + delete) beyond the explicit task list, honoring design's testing-strategy line "Errors surface, not swallowed." Small addition, no structural deviation.
- Actual line count (724) exceeds the tasks.md estimate (350-480) but stays within the session's 800-line budget for this slice. The excess comes from the exhaustive tri-state/round-trip/error coverage described above, not from any change to production code shape.

### Issues Found

None.

### Remaining Tasks (as of Phase 1)

- [ ] Phase 2: `listasCollection.ts` / `articulosCollection.ts` (PR 2 — task 044)
- [ ] Phase 3: `realtime.ts` (PR 3 — task 045)
- [ ] Phase 4: Refetch flags on both collections (PR 4 — task 046)

### Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main)
- Current work unit: Unit 1 — `listasRepository.ts` + `articulosRepository.ts`
- Boundary: starts from no prior infrastructure code in `modules/listas/`; ends with both repositories fully implemented, tested, and typed, ready for Phase 2 collections to import them
- Estimated review budget impact: 724 changed lines (additions only, new files) — within the 800-line session budget for this slice; PR 1 of 4 in the stacked chain

### Status

9/9 Phase 1 tasks complete. Ready for verify (Phase 1 scope only).

---

## Slice: Phase 2 — `listasCollection.ts` / `articulosCollection.ts` (PR 2 — task 044)

**Mode**: Strict TDD
**Status**: Phase 2 complete (7/7 tasks). Phases 3-4 not started (out of scope for this run).

### Completed Tasks

- [x] 2.1 RED `listasCollection.test.ts` + `articulosCollection.test.ts`: collection built via `queryCollectionOptions` loads from `queryFn`; record retrievable by `getKey` (`id`)
- [x] 2.2 RED same files: `onInsert` calls `insertarLista`/`insertarArticulo` with no other repository call; `onDelete` calls `eliminarLista`/`eliminarArticulo` with the id
- [x] 2.3 RED same files: with `staleTime: Infinity`, a record written via `writeUpdate` survives; no automatic background refetch fires from staleness alone
- [x] 2.4 RED same files: a rejected `onUpdate` reverts to the prior confirmed value (`contenido` for `Articulo`, `nombre` for `Lista`); a rejected `onDelete` restores the removed record with its prior data
- [x] 2.5 GREEN `listasCollection.ts`: `crearListasCollection(queryClient, householdId)` factory (D5) — `queryKey: ['listas', householdId]`, `getKey: (x) => x.id`, `staleTime: Infinity`, `onInsert`/`onUpdate`/`onDelete` delegating to `listasRepository`
- [x] 2.6 GREEN `articulosCollection.ts`: `crearArticulosCollection(queryClient, householdId)` factory, household-wide `queryKey: ['articulos', householdId]` (D5), same option shape delegating to `articulosRepository`
- [x] 2.7 REFACTOR both files: confirmed neither imports `@/app/**` or `@/shared/hogar` (§2, §3.2); full suite and `tsc --noEmit` both clean

### Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `frontend/src/modules/listas/infrastructure/listasCollection.ts` | Created | `crearListasCollection(queryClient, householdId)` factory building a `queryCollectionOptions` collection: `queryKey: ['listas', householdId]`, `getKey: (x) => x.id`, `staleTime: Infinity`, `onInsert`/`onUpdate`/`onDelete` delegating to `listasRepository`. 43 lines. |
| `frontend/src/modules/listas/infrastructure/listasCollection.test.ts` | Created | Mocks `./listasRepository` (established boundary-mocking convention); real in-memory `@tanstack/react-db` `Collection` + fresh `QueryClient` per test. Covers load-from-`queryFn`, `onInsert`/`onDelete` delegation, `staleTime: Infinity` config + write survival, and rejected-`onUpdate`/`onDelete` revert. 140 lines. |
| `frontend/src/modules/listas/infrastructure/articulosCollection.ts` | Created | `crearArticulosCollection(queryClient, householdId)` factory, household-wide `queryKey: ['articulos', householdId]`, same option shape delegating to `articulosRepository`. 46 lines. |
| `frontend/src/modules/listas/infrastructure/articulosCollection.test.ts` | Created | Same coverage pattern as `listasCollection.test.ts`, scoped to `Articulo`; the rejected-`onUpdate` test is the spec's literal `contenido: "Leche"` → `"Pan"` revert scenario. 146 lines. |

### TDD Cycle Evidence

| Task | RED (observed failure) | GREEN | REFACTOR |
|------|------------------------|-------|----------|
| 2.1-2.4 (`listasCollection` / `articulosCollection`) | `pnpm test -- listasCollection.test.ts articulosCollection.test.ts` failed: `Failed to resolve import "./listasCollection"` / `"./articulosCollection"` (modules did not exist) | Implemented both collection factories; first pass failed `tsc`/import resolution on `@tanstack/db` (not a direct dependency — `@tanstack/react-db` re-exports it and is the actual installed package), corrected the import source; then 2 assertion failures from `.get()` returning virtual props (`$collectionId`, `$key`, `$origin`, `$synced`) alongside domain fields, fixed by switching those two assertions from `toEqual` to `toMatchObject`; combined run → all tests pass | Confirmed no `@/app/**` or `@/shared/hogar` import in either file; full suite (21 files / 129 tests) and `tsc --noEmit` both clean |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `cd frontend && pnpm test -- listasCollection.test.ts articulosCollection.test.ts` → 2 test files, 12 new tests, all pass |
| Runtime harness command/scenario and exact result | N/A — real in-memory `@tanstack/db` `Collection` + fresh `QueryClient` per test, repository mocked, no live backend or socket (per tasks.md's own Runtime Harness column for Unit 2) |
| Rollback boundary | Revert the 4 new files listed above; `listasRepository.ts`/`articulosRepository.ts` from PR 1 remain independently valid |

### Full-Suite Verification

- `cd frontend && pnpm test` → **21 test files, 129 tests, all passing** (baseline before this slice was 19 files / 117 tests; +2 files / +12 tests, zero regressions)
- `cd frontend && pnpm exec tsc --noEmit` → clean, no errors

### Requirement/Scenario Coverage (listas-collections spec — 4/4 requirements, 6/6 scenarios)

| Requirement | Scenario | Test |
|---|---|---|
| One `queryCollectionOptions` collection per table | The collection loads from the query function | `crearListasCollection`/`crearArticulosCollection` "loads … from queryFn and each record is retrievable by id via getKey" |
| Mutation handlers delegate to the repository | An insert mutation calls the repository create function | "`onInsert` delegates to `insertarLista`/`insertarArticulo` and makes no other repository call" |
| Mutation handlers delegate to the repository | A delete mutation calls the repository delete function | "`onDelete` delegates to `eliminarLista`/`eliminarArticulo` with the id" |
| High `staleTime` to avoid clobbering realtime writes | A realtime-applied write survives past the default stale window | "configures `staleTime: Infinity` so a direct write is not clobbered by a refetch" |
| Optimistic mutations revert on server rejection | A rejected update reverts to the prior confirmed value | "a rejected `onUpdate` reverts `contenido`/`nombre` to the prior confirmed value" |
| Optimistic mutations revert on server rejection | A rejected delete restores the removed record | "a rejected `onDelete` restores the removed `Lista`/`Articulo` with its prior data" |

### Deviations from Design

- Design's interface sketch and boundary-compliance table reference `@tanstack/db` for the `Collection` type/`createCollection`. `@tanstack/db` is present in `node_modules` only as a transitive dependency (of `@tanstack/query-db-collection` and `@tanstack/react-db`), not a direct `package.json` dependency, so Vite cannot resolve a bare `@tanstack/db` import from application code. `@tanstack/react-db@0.3.1` (an existing direct dependency) re-exports the entirety of `@tanstack/db`, including `createCollection` and the `Collection` type (confirmed at `@tanstack/react-db/dist/esm/index.d.ts`), so both collection files import from `@tanstack/react-db` instead. No `package.json` change was needed, and the resulting factory signatures match the design's interfaces exactly (`crearListasCollection(queryClient, householdId): Collection<Lista, string>`).
- `.get()` on a `@tanstack/db` collection returns the record plus virtual properties (`$collectionId`, `$key`, `$origin`, `$synced`) that are not part of the domain type. Two tests originally asserted `toEqual(original)`; both were changed to `toMatchObject(original)`, which is a test-only adjustment with no production-code impact.

### Issues Found

None.

### Remaining Tasks

- [ ] Phase 3: `realtime.ts` (PR 3 — task 045)
- [ ] Phase 4: Refetch flags on both collections (PR 4 — task 046)

### Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main)
- Current work unit: Unit 2 — `listasCollection.ts` + `articulosCollection.ts`
- Boundary: starts from Phase 1's repositories (already merged/valid on their own); ends with both collections fully implemented, tested, and typed, ready for Phase 3's `realtime.ts` to write directly into their synced state
- Estimated review budget impact: 375 changed lines (additions only, new files) — within the 800-line session budget for this slice; PR 2 of 4 in the stacked chain

### Status

16/16 tasks complete across Phase 1 + Phase 2 (9/9 + 7/7). Ready for verify (Phase 1 + Phase 2 scope). Phases 3-4 remain.

---

## Slice: Phase 3 — `realtime.ts` (PR 3 — task 045)

**Mode**: Strict TDD
**Status**: Phase 3 complete (16/16 tasks, including 3.2b). Phase 4 not started (out of scope for this run).

### Completed Tasks

- [x] 3.1 RED `realtime.test.ts`: `iniciarSuscripcionHogar` subscribes to channel `household:<id>` using only the supplied `householdId`
- [x] 3.2 RED same file: a `list.insert` message for an unknown list lands as a single `writeUpsert`, no `writeBatch`, no invalidation
- [x] 3.2b RED same file: a `list.insert` echo for an already-synced list (differing `updated_at`/`updated_by`) raises no error and lands the message's values — the exact case `writeInsert` would fail with `DuplicateKeySyncError`
- [x] 3.3 RED same file: `item.update` lands in `articulosCollection`; `list.update` and `item.insert` also proven landing in the correct collection (full six-event coverage split across this and the cascade tests below)
- [x] 3.4 RED same file: the `error` handler is registered and invoked with no unhandled error escaping
- [x] 3.5 RED same file: `queryClient.invalidateQueries` is never called while handling `list.update` / `item.insert`
- [x] 3.6 RED same file: `list.delete` followed by `item.delete` for its two already-cascaded items completes without throwing, **and** the `alReportar` spy proves nothing was even caught-and-swallowed (see Issues Found — this assertion was added after mutation testing showed a throw-based assertion alone does not distinguish a filtered no-op from a caught `DeleteOperationItemNotFoundError`)
- [x] 3.7 RED same file: filtering before emitting keeps a concurrent legitimate `writeUpdate` inside the same `articulosCollection.writeBatch` when a sibling absent-key delete is filtered out first
- [x] 3.8 RED same file: pins the `collection.has(key) === true` vs `estaSincronizado(collection, key) === false` divergence after an optimistic insert; a different already-cascaded key's delete in the same batch does not throw
- [x] 3.9 RED same file: `filaDesdeMensaje` maps a message missing `bought_at` and one with `bought_at: null` to the same `bought_at: null`
- [x] 3.10 RED same file: `filaDesdeMensaje` produces identical row data whether `meta.senderId` is absent or `null`
- [x] 3.11 RED same file: a message failing the `typeof meta.messageId === 'string'` shape guard is dropped (throws, caught and reported by the caller)
- [x] 3.12 GREEN `realtime.ts`: implemented `filaDesdeMensaje` — spread minus `meta`, validate `meta` shape, drop non-`'system'` `senderType`, normalize `bought_at`/`bought_by` null-vs-missing. Passes 3.9-3.11.
- [x] 3.13 GREEN same file: implemented `estaSincronizado(coleccion, clave)` reading `coleccion._state.syncedData.has(clave)`; filters `writeDelete` batch membership through it before emitting. Passes 3.6-3.8.
- [x] 3.14 GREEN same file: implemented `iniciarSuscripcionHogar` — connect, subscribe, six `.on()` handlers each emitting one direct `writeUpsert`/`writeDelete` per message; `list.delete` cascade runs the articulos batch first, then the lista delete; `error` handler calls `alReportar` (default `console.error`), never throws/invalidates/retries. Passes 3.1-3.5.
- [x] 3.15 REFACTOR: confirmed `realtime.ts` imports only `@tanstack/react-db` (type), `@insforge/sdk` (types), `@/shared/api/insforge`, `./listasRepository`, `./articulosRepository`, `../domain/lista`, `../domain/articulo` — no `@/shared/hogar`, no `@/app/**`; full suite and `tsc --noEmit` both clean.

### Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `frontend/src/modules/listas/infrastructure/realtime.ts` | Created | `estaSincronizado`, `filaDesdeMensaje`, and `iniciarSuscripcionHogar` — six `.on()` handlers translating the household channel into direct `writeUpsert`/`writeDelete`/`writeBatch` calls per design D1-D7; returns an idempotent `SuscripcionHogar.detener()`. 248 lines. |
| `frontend/src/modules/listas/infrastructure/realtime.test.ts` | Created | Fakes `insforge.realtime` as an in-memory emitter (`vi.hoisted` + `vi.mock('@/shared/api/insforge')`); mocks only the network-calling repository CRUD functions via `vi.importActual` merges, keeping `listaDesdeFila`/`articuloDesdeFila` real; real `crearListasCollection`/`crearArticulosCollection` collections from Phase 2. Covers all 6 requirements / 11 scenarios of `listas-realtime/spec.md`. 419 lines. |

### TDD Cycle Evidence

| Task | RED (observed failure) | GREEN | REFACTOR |
|------|------------------------|-------|----------|
| 3.1-3.15 (`realtime`) | `pnpm test -- realtime.test.ts` failed: `Failed to resolve import "./realtime" from "realtime.test.ts"` (module did not exist; confirmed by temporarily removing the already-written implementation and re-running — same failure) | Implemented `realtime.ts`; `pnpm test -- realtime.test.ts` → all tests pass | Confirmed import boundary; full suite (22 files / 143 tests) and `tsc --noEmit` both clean |

**Mutation-testing verification** (beyond the standard RED/GREEN cycle, performed because this phase carries the change's two most safety-critical decisions): temporarily reverted D2 (removed the `estaSincronizado` filter from the standalone item-delete handler) and re-ran — the cascade test (3.6) failed with the exact `DeleteOperationItemNotFoundError` design predicted, confirming the guard is load-bearing. Temporarily reverted D1 (`writeUpsert` → `writeInsert`) and re-ran — 3 tests failed including the echo regression (3.2b), confirming `writeUpsert` is load-bearing. Both mutations were reverted immediately after observing the expected failures; the restored file is byte-identical to the version committed here.

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `cd frontend && pnpm test -- realtime.test.ts` → 1 test file, 14 new tests, all pass |
| Runtime harness command/scenario and exact result | N/A — no E2E runner; `insforge.realtime` faked as an in-memory emitter, real in-memory `@tanstack/db` collections from Phase 2, no live socket (per tasks.md's own Runtime Harness column for Unit 3) |
| Rollback boundary | Revert the 2 new files listed above; Phase 1 + Phase 2 remain independently valid — collections keep working on initial load only |

### Full-Suite Verification

- `cd frontend && pnpm test` → **22 test files, 143 tests, all passing** (baseline before this slice was 21 files / 129 tests; +1 file / +14 tests, zero regressions)
- `cd frontend && pnpm exec tsc --noEmit` → clean, no errors

### Requirement/Scenario Coverage (listas-realtime spec — 6/6 requirements, 11/11 scenarios)

| Requirement | Scenario | Test |
|---|---|---|
| Household-parameterized connect and subscribe | Subscribing uses the supplied household id | "subscribes to channel household:<id> using only the supplied householdId" |
| Six-event translation into direct writes | A list.insert event lands in the list collection | "a list.insert event lands in listasCollection as a single writeUpsert, no writeBatch, no invalidation" |
| Six-event translation into direct writes | A list.insert echo for a row this client already inserted does not throw | "a list.insert echo for an already-synced list does not throw and lands the message values (D1 regression)" |
| Six-event translation into direct writes | An item.update event lands in the item collection | "an item.update event lands in articulosCollection as a single writeUpsert, no writeBatch, no invalidation" |
| Registered realtime error handler | A realtime error is observed rather than left unhandled | "invokes the reporter with no unhandled error escaping the subscription setup" |
| No query invalidation on any realtime event | A batch of events over both entities triggers no invalidation | "never calls invalidateQueries while handling a list.update and an item.insert" |
| Cascade-safe batch membership filtering | A list delete followed by its already-cascaded item deletes does not throw | "a list.delete followed by item.delete for its already-cascaded items does not throw" |
| Cascade-safe batch membership filtering | A cascade-orphaned delete does not discard a concurrent legitimate write | "filtering before emitting keeps a concurrent legitimate write inside the same writeBatch" |
| Cascade-safe batch membership filtering | A guard based on optimistic presence alone is insufficient | "a guard based on optimistic presence alone is insufficient (has() vs estaSincronizado() divergence)" |
| Envelope parsing via one narrow adapter | A missing purchase field and an explicit null are treated identically | "treats a missing bought_at and an explicit bought_at: null identically" |
| Envelope parsing via one narrow adapter | meta.senderId presence does not affect translation | "produces the same row data whether meta.senderId is absent or null" |

Plus two tests beyond the 11 spec scenarios: the `typeof meta.messageId === 'string'` shape guard (design guard #3) and the non-`'system'` `senderType` drop-and-report path (design's defense-in-depth line), both explicitly required by this run's brief.

### Deviations from Design

- **Null-vs-missing normalization moved from the mapper to the adapter.** Design's D2/interface narrative says `articuloDesdeFila` uses `fila.bought_by ?? null`. Phase 1's actual `articuloDesdeFila` (already merged, out of this slice's edit scope) reads `bought_at`/`bought_by` directly with no `??`. Since editing Phase 1 files was out of scope for this run, the null-vs-missing normalization for these two columns was implemented in `filaDesdeMensaje` instead — which is also where the spec (`listas-realtime/spec.md`, "Envelope parsing via one narrow adapter") explicitly assigns this responsibility in its own requirement text, so this is a resolution of a design/spec inconsistency in the spec's favor, not a new decision. The extra `bought_at: null`/`bought_by: null` keys added to non-`Articulo` rows (e.g. `Lista` messages) are harmless — `listaDesdeFila` ignores unknown keys.
- **`filaDesdeMensaje` throws rather than returning `Record<string, unknown>` unconditionally for the non-`'system'`-sender case.** Design's interface sketch shows a non-nullable return type and separately narrates the shape guard (#3) and the `senderType` drop (#1) as two different defensive lines without naming a `FalloRealtime` variant for the latter. Both are implemented as a throw from `filaDesdeMensaje`, caught by the caller and reported as `{ tipo: 'mensaje-ilegible' }` — the closest fit among the three declared `FalloRealtime` variants, and consistent with "the check exists so an RLS regression is visible instead of silent."
- **`estaSincronizado` is exported.** Design's top-level "Interfaces / Contracts" summary table does not list it, but the D2 section's own text requires "a test [to] pin the divergence itself" by calling `estaSincronizado` directly, and task 3.8 names it explicitly — treated as an omission from the summary table, not a conflict.
- Actual line count (667: 248 implementation + 419 test) exceeds the tasks.md estimate (300-420) but stays within the session's 800-line budget. The excess is from the mutation-testing-driven strengthening of the 3.6 assertion (an `alReportar` spy, not just a throw check) and from covering two additional design-mandated behaviors (guard #3, non-system-sender drop) beyond the 11 literal spec scenarios.

### Issues Found

- **Test-design gap caught by self-review, not by the user:** the first version of test 3.6 asserted only `expect(() => { ... }).not.toThrow()`. Because every handler in `realtime.ts` wraps its body in `try`/`catch` and reports via `alReportar` rather than letting exceptions escape (D7), that assertion is trivially true regardless of whether the D2 guard is present — a regressed, unguarded `writeDelete` would throw internally, get caught, get reported, and the outer `expect(...).not.toThrow()` would still pass. Verified this gap directly: with the guard removed, all 143 tests still passed. Fixed by adding `expect(alReportar).not.toHaveBeenCalled()` to the same test, then re-verified via mutation testing (see TDD Cycle Evidence above) that this version does fail against the unguarded implementation, with the exact `DeleteOperationItemNotFoundError` design predicted. No other issues found.

### Remaining Tasks

- [ ] Phase 4: Refetch flags on both collections (PR 4 — task 046)

### Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main)
- Current work unit: Unit 3 — `realtime.ts`
- Boundary: starts from Phase 2's collections (already merged/valid on their own, load-only until this slice); ends with the full six-event realtime translation implemented, tested, and typed. Task 045 is functionally inert at runtime until task 047 (`useHogar`) supplies a real `householdId` (declared in the proposal as risk #3, not a blocker for this change's own tests).
- Estimated review budget impact: 667 changed lines (additions only, new files) — within the 800-line session budget for this slice; PR 3 of 4 in the stacked chain

### Status

32/32 tasks complete across Phase 1 + Phase 2 + Phase 3 (9/9 + 7/7 + 16/16). Ready for verify (Phase 1 + Phase 2 + Phase 3 scope). Phase 4 remains.

---

## Slice: Phase 4 — Refetch flags on both collections (PR 4 — task 046)

**Mode**: Strict TDD
**Status**: Phase 4 complete (5/5 tasks). All 36 tasks in `tasks.md` now complete.

### Completed Tasks

- [x] 4.1 RED `listasCollection.test.ts` + `articulosCollection.test.ts`: with `staleTime: Infinity`, dispatching a recognized focus-regain event triggers a `queryFn` invocation (spy call count, not the `'always'` literal); no focus event means no extra invocation
- [x] 4.2 RED same files: dispatching a recognized `online` event triggers a `queryFn` invocation inside the stale window
- [x] 4.3 RED same files: simulate a dropped connection during which a change happened elsewhere, then reconnect — the resulting refetch resolves and the collection reflects the missed change
- [x] 4.4 GREEN `listasCollection.ts` + `articulosCollection.ts`: added `refetchOnWindowFocus: 'always'` and `refetchOnReconnect: 'always'` (D6) to both `queryCollectionOptions` configs
- [x] 4.5 REFACTOR: confirmed no test in the suite asserts only the `'always'` config literal instead of an actual `queryFn` invocation; full suite and `tsc --noEmit` both clean across all four slices together

### Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `frontend/src/modules/listas/infrastructure/listasCollection.ts` | Modified | Added `refetchOnWindowFocus: 'always'` and `refetchOnReconnect: 'always'` to the `queryCollectionOptions` config, with a comment explaining why `'always'` and not `true` (design D6: `staleTime: Infinity` means the query is never "stale", so `true` — which only refetches an already-stale query — would be a silent no-op). +7 lines. |
| `frontend/src/modules/listas/infrastructure/listasCollection.test.ts` | Modified | Added a `refetch on focus regain and reconnect` describe block: focus-regain (`visibilitychange`) triggers a real `obtenerListas` re-invocation; no event means no extra invocation; reconnect (`offline` then `online`, since TanStack's `onlineManager` only notifies on a state *change*) triggers a re-invocation; a full round trip proving a change missed while disconnected is picked up once the reconnect refetch resolves. Also converted the pre-existing `describe('crearListasCollection', ...)` block's six tests from a local `const collection` to a shared outer `let collection` + `afterEach(() => collection?.cleanup())`, because task 046's `'always'` options subscribe each collection's internal `QueryClient` to the process-wide TanStack Query `focusManager`/`onlineManager` singletons for as long as it stays mounted — an uncleaned collection from an earlier test would otherwise also refetch (and inflate call counts) when a later test dispatches a global `visibilitychange`/`online`/`offline` event. +106 lines. |
| `frontend/src/modules/listas/infrastructure/articulosCollection.ts` | Modified | Same two-option addition, mirrored for `Articulo`. +7 lines. |
| `frontend/src/modules/listas/infrastructure/articulosCollection.test.ts` | Modified | Same new describe block and the same `const` → shared `let` + `afterEach` cleanup conversion, mirrored for `Articulo`/`contenido`. +106 lines. |

### TDD Cycle Evidence

| Task | RED (observed failure) | GREEN | REFACTOR |
|------|------------------------|-------|----------|
| 4.1-4.3 | Added the 8 new focus/online/reconnect tests before touching either collection's options. `pnpm exec vitest run listasCollection.test.ts articulosCollection.test.ts` failed with 6 of 8 new tests red (`toHaveBeenCalledTimes(2)` observed `1`; the "reflects a change" tests observed the original, unchanged value) — the 2 "no event → no extra call" tests passed trivially (expected, since they assert absence). This is the correct RED: failure caused by the missing config, not a typo or wrong harness. | Added `refetchOnWindowFocus: 'always'` + `refetchOnReconnect: 'always'` to both `queryCollectionOptions` configs. First GREEN attempt still showed the *online* scenarios failing (`toHaveBeenCalledTimes` stuck at `1`) — root-caused via a throwaway debug test (deleted before commit) reading TanStack Query's `onlineManager` source directly: `OnlineManager#online` starts `true`, and `setOnline` only notifies listeners when the value *changes*, so a bare `online` dispatch with no prior `offline` is a no-op. Fixed by dispatching `offline` before `online` in every reconnect test. Second attempt showed the focus/online tests passing individually but exploding to `8` calls when run together with the pre-existing describe block — traced to the pre-existing tests' collections never being cleaned up, so their internal `QueryClient`s stayed permanently subscribed to the global `focusManager`/`onlineManager` singletons and all refetched in response to this slice's dispatched events. Fixed by converting the pre-existing block to shared `let collection` + `afterEach` cleanup (see Files Changed). Final run: all 8 new tests green. | Confirmed grep across both test files for any assertion checking `refetchOnWindowFocus`/`refetchOnReconnect` as a literal value instead of an actual `queryFn` call — none exists; every assertion is on the mocked repository function's call count or on collection data. Full suite (`pnpm test`) and `pnpm exec tsc --noEmit` both clean. |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `cd frontend && pnpm exec vitest run src/modules/listas/infrastructure/listasCollection.test.ts src/modules/listas/infrastructure/articulosCollection.test.ts` → 2 test files, 20 tests (12 pre-existing + 8 new), all pass |
| Runtime harness command/scenario and exact result | Dispatched `window` `visibilitychange`/`online`/`offline` events against the mocked `queryFn` (repository function) inside a real in-memory `@tanstack/db` `Collection` + real `QueryClient`, `waitFor` polling reused from `app/providers/query.test.tsx`'s harness pattern — no real network drop (per tasks.md's own Runtime Harness column for Unit 4) |
| Rollback boundary | Remove the two option lines from both collection files and revert the two test files to their Phase 2 state; PR 2 behavior (load + optimistic mutations, no focus/reconnect repair) is restored |

### Full-Suite Verification

- `cd frontend && pnpm test` → **22 test files, 151 tests, all passing** (baseline before this slice was 22 files / 143 tests; +8 tests, zero regressions, zero new files)
- `cd frontend && pnpm exec tsc --noEmit` → clean, no errors

### Requirement/Scenario Coverage (listas-refetch spec — 3/3 requirements, 4/4 scenarios)

| Requirement | Scenario | Test |
|---|---|---|
| Refetch actually occurs on window focus regain | A focus event forces a refetch inside the stale window | "a window focus-regain event triggers a queryFn refetch despite staleTime: Infinity" (both collections) |
| Refetch actually occurs on window focus regain | No focus event means no extra refetch | "no focus-regain event means no extra queryFn invocation beyond the initial load" (both collections) |
| Refetch actually occurs on reconnect | An online event forces a refetch inside the stale window | "a window online (reconnect) event triggers a queryFn refetch despite staleTime: Infinity" (both collections) |
| Returning after a dropped connection shows up-to-date data | Data missed while disconnected appears after reconnect | "reflects a change made on another device once the post-reconnect refetch resolves" (both collections) |

### Deviations from Design

- None in production code — exactly the two option lines (D6) on both collections, as specified.
- Test-only deviation, already covered above: the pre-existing Phase 2 tests in both files were converted from a per-test `const collection` to a shared `let collection` + `afterEach` cleanup. This was necessary test hygiene introduced by this slice's own change (once `refetchOnWindowFocus`/`refetchOnReconnect: 'always'` exist, an uncleaned collection becomes a permanent listener on the process-wide TanStack Query singletons), not a deviation from tasks.md or design — no scenario or requirement coverage changed.
- Actual line count for this slice (226: 7 + 7 + 106 + 106) exceeds the tasks.md estimate (80-150) but stays well within the session's 800-line budget. The excess is almost entirely the pre-existing-block cleanup refactor forced by the leakage described above, not new test surface beyond the 4 required scenarios.

### Issues Found

- **Self-caught during RED→GREEN, not by the user:** two rounds of debugging were needed before the new tests passed for the right reason (see TDD Cycle Evidence) — the `onlineManager`'s change-only notification semantics, and pre-existing-test QueryClient leakage inflating call counts once `'always'` was added globally. Both were root-caused by reading the installed `@tanstack/query-core`/`@tanstack/query-db-collection` source directly (via a throwaway debug test, deleted before this file was written) rather than guessing, per this run's "do not fake success" instruction. No other issues found.

### Remaining Tasks

None. All 36 tasks across Phase 1 + Phase 2 + Phase 3 + Phase 4 (9/9 + 7/7 + 16/16 + 5/5) are complete.

### Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main)
- Current work unit: Unit 4 — refetch flags on `listasCollection.ts` + `articulosCollection.ts`
- Boundary: starts from Phase 2's collections (already merged/valid on their own, socket-repair-blind until this slice); ends with both collections repairing themselves after a focus regain or reconnect even though `staleTime: Infinity` would otherwise make that silent. This is the last slice — no further phases follow.
- Estimated review budget impact: 226 changed lines — within the 800-line session budget for this slice; PR 4 of 4 in the stacked chain (final)

### Status

36/36 tasks complete across Phase 1 + Phase 2 + Phase 3 + Phase 4 (9/9 + 7/7 + 16/16 + 5/5). Ready for verify (full change scope). No phases remain.
