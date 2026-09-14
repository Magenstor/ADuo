```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:792b2295d9c9359eb7fa933c4dcf37e0f9dbb4f8ff2501b495c05475a386b7f5
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 17/17
scenarios: 29/29
test_command: cd frontend && pnpm test
test_exit_code: 0
test_output_hash: sha256:c4c3c83c075cbc3164389441eb8fdd757ca154974d4d85fdb54f0de18481f6c5
build_command: cd frontend && pnpm exec tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:e64612cd61ce0f97ac39d2a12bd1c02a56aacee39e6346190e25b0c736fae63c
```

## Verification Report

**Change**: infraestructura-datos-realtime
**Version**: N/A (HEAD 393c12df, uncommitted working tree)
**Mode**: Strict TDD
**Scope**: full change — Phases 1-4 (ADuo tasks 043-046)

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 37 (36 + 3.2b) |
| Tasks complete | 37 |
| Tasks incomplete | 0 |

### Build & Tests Execution
**Build / type check**: ✅ Passed
```text
cd frontend && pnpm exec tsc --noEmit   → exit 0, no output
cd frontend && pnpm lint                → exit 0
cd frontend && pnpm check               → exit 0 ("All matched files use Prettier code style!")
```

**Tests**: ✅ 151 passed / 0 failed / 0 skipped
```text
cd frontend && pnpm test
 RUN  v4.1.11
 Test Files  22 passed (22)
      Tests  151 passed (151)
Focused: pnpm exec vitest run src/modules/listas/infrastructure → 5 files / 52 tests passed
```

**Coverage** (v8, changed production files only): 85% lines aggregate → ⚠️ see Changed File Coverage

### Spec Compliance Matrix
Counted directly from the four `spec.md` files: 17 `### Requirement:` headings, 29 `#### Scenario:` headings (listas-collections 4/6, listas-realtime 6/11, listas-refetch 3/4, listas-repository 4/8).

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| listas-repository / Domain-typed CRUD surface | A create call returns a domain type | `listasRepository.test.ts > insertarLista > returns a Lista for a valid creation payload`; `articulosRepository.test.ts > insertarArticulo > returns an Articulo for a valid creation payload` | ✅ COMPLIANT |
| listas-repository / Domain-typed CRUD surface | A read call never exposes raw columns | `articulosRepository.test.ts > obtenerArticulos > returns Articulo[] with no content, is_bought, or list_id keys`; `listasRepository.test.ts > obtenerListas > returns Lista[] with no name or household_id keys` | ✅ COMPLIANT |
| listas-repository / Bidirectional row-domain mapping | A round trip preserves every field | `listasRepository.test.ts > round-trips every field of a fully populated Lista`; `articulosRepository.test.ts > round-trips every field of a fully populated Articulo` | ✅ COMPLIANT |
| listas-repository / Bidirectional row-domain mapping | An update payload uses table column names | `articulosRepository.test.ts > builds a write payload keyed by content, not contenido`; `actualizarArticulo > returns the updated Articulo filtered by id` (asserts `update()` payload keys) | ✅ COMPLIANT |
| listas-repository / Exact preservation of the purchase tri-state | An unpurchased row maps to all-empty purchase fields | `articulosRepository.test.ts > maps an unpurchased row to all-empty purchase fields` | ✅ COMPLIANT |
| listas-repository / Exact preservation of the purchase tri-state | A purchased row maps to fully populated purchase fields | `articulosRepository.test.ts > maps a purchased row to fully populated purchase fields exactly as read` | ✅ COMPLIANT |
| listas-repository / Hard delete with no soft-delete filter | Deleting a list issues no soft-delete filter | `listasRepository.test.ts > eliminarLista > issues a hard delete with no soft-delete filter and no filter beyond id` | ✅ COMPLIANT |
| listas-repository / Hard delete with no soft-delete filter | Deleting an item issues no soft-delete filter | `articulosRepository.test.ts > eliminarArticulo > issues a hard delete with no soft-delete filter and no filter beyond id` | ✅ COMPLIANT |
| listas-collections / One `queryCollectionOptions` collection per table | The collection loads from the query function | `listasCollection.test.ts > loads Listas from queryFn and each record is retrievable by id via getKey`; `articulosCollection.test.ts > loads Articulos from queryFn ...` | ✅ COMPLIANT |
| listas-collections / Mutation handlers delegate to the repository | An insert mutation calls the repository create function | `listasCollection.test.ts > onInsert delegates to insertarLista and makes no other repository call`; `articulosCollection.test.ts > onInsert delegates to insertarArticulo ...` | ✅ COMPLIANT |
| listas-collections / Mutation handlers delegate to the repository | A delete mutation calls the repository delete function | `articulosCollection.test.ts > onDelete delegates to eliminarArticulo with the id`; `listasCollection.test.ts > onDelete delegates to eliminarLista with the id` | ✅ COMPLIANT |
| listas-collections / High `staleTime` | A realtime-applied write survives past the default stale window | `listasCollection.test.ts > configures staleTime: Infinity so a direct write is not clobbered by a refetch`; `articulosCollection.test.ts > (same)` | ✅ COMPLIANT (see SUGGESTION S1: pinned mainly by the config literal) |
| listas-collections / Optimistic mutations revert on server rejection | A rejected update reverts to the prior confirmed value | `articulosCollection.test.ts > a rejected onUpdate reverts contenido to the prior confirmed value` (literal `Leche` → `Pan` → `Leche`); `listasCollection.test.ts > a rejected onUpdate reverts to the prior confirmed value` | ✅ COMPLIANT |
| listas-collections / Optimistic mutations revert on server rejection | A rejected delete restores the removed record | `listasCollection.test.ts > a rejected onDelete restores the removed Lista with its prior data`; `articulosCollection.test.ts > (same for Articulo)` | ✅ COMPLIANT |
| listas-realtime / Household-parameterized connect and subscribe | Subscribing uses the supplied household id | `realtime.test.ts > subscribes to channel household:<id> using only the supplied householdId` (collections built for a different household; `subscribe` asserted with `household:a1b2c3`); "no other module" proven statically by import audit | ✅ COMPLIANT |
| listas-realtime / Six-event translation into direct writes | A `list.insert` event lands in the list collection | `realtime.test.ts > a list.insert event lands in listasCollection as a single writeUpsert, no writeBatch, no invalidation` | ✅ COMPLIANT |
| listas-realtime / Six-event translation into direct writes | A `list.insert` echo for a row this client already inserted does not throw | `realtime.test.ts > a list.insert echo for an already-synced list does not throw and lands the message values (D1 regression)` — value assertion is load-bearing (a `writeInsert` regression would be caught by the handler and leave the stale value) | ✅ COMPLIANT |
| listas-realtime / Six-event translation into direct writes | An `item.update` event lands in the item collection | `realtime.test.ts > an item.update event lands in articulosCollection as a single writeUpsert, no writeBatch, no invalidation` | ✅ COMPLIANT |
| listas-realtime / Registered realtime error handler | A realtime error is observed rather than left unhandled | `realtime.test.ts > invokes the reporter with no unhandled error escaping the subscription setup` | ✅ COMPLIANT |
| listas-realtime / No query invalidation on any realtime event | A batch of events over both entities triggers no invalidation | `realtime.test.ts > never calls invalidateQueries while handling a list.update and an item.insert` | ✅ COMPLIANT |
| listas-realtime / Cascade-safe batch membership filtering | A list delete followed by its already-cascaded item deletes does not throw | `realtime.test.ts > a list.delete followed by item.delete for its already-cascaded items does not throw` — asserts end state AND `expect(alReportar).not.toHaveBeenCalled()`, so a caught-and-reported `DeleteOperationItemNotFoundError` fails the test | ✅ COMPLIANT |
| listas-realtime / Cascade-safe batch membership filtering | A cascade-orphaned delete does not discard a concurrent legitimate write in the same batch | `realtime.test.ts > filtering before emitting keeps a concurrent legitimate write inside the same writeBatch` — the batch is hand-built in the test; the only production code on the path is `estaSincronizado`; `iniciarSuscripcionHogar` is not exercised and under D3 never builds such a batch | ✅ COMPLIANT (literal GIVEN/WHEN/THEN met; translator not on the path — W2) |
| listas-realtime / Cascade-safe batch membership filtering | A guard based on optimistic presence alone is insufficient | `realtime.test.ts > a guard based on optimistic presence alone is insufficient (has() vs estaSincronizado() divergence)` — asserts `has() === true` and `estaSincronizado() === false`; fails if the predicate were implemented with `has()` | ✅ COMPLIANT |
| listas-realtime / Envelope parsing via one narrow adapter | A missing purchase field and an explicit null are treated identically | `realtime.test.ts > treats a missing bought_at and an explicit bought_at: null identically` (adapter level, `bought_at` only — see S4) | ✅ COMPLIANT |
| listas-realtime / Envelope parsing via one narrow adapter | `meta.senderId` presence does not affect translation | `realtime.test.ts > produces the same row data whether meta.senderId is absent or null` | ✅ COMPLIANT |
| listas-refetch / Refetch actually occurs on window focus regain | A focus event forces a refetch inside the stale window | `listasCollection.test.ts > a window focus-regain event triggers a queryFn refetch despite staleTime: Infinity`; `articulosCollection.test.ts > (same)` — asserts `obtenerListas`/`obtenerArticulos` call count 1 → 2, not the `'always'` literal | ✅ COMPLIANT |
| listas-refetch / Refetch actually occurs on window focus regain | No focus event means no extra refetch | `listasCollection.test.ts > no focus-regain event means no extra queryFn invocation beyond the initial load`; `articulosCollection.test.ts > (same)` | ✅ COMPLIANT |
| listas-refetch / Refetch actually occurs on reconnect | An online event forces a refetch inside the stale window | `listasCollection.test.ts > a window online (reconnect) event triggers a queryFn refetch despite staleTime: Infinity`; `articulosCollection.test.ts > (same)` — dispatches `offline` then `online` because `onlineManager` only notifies on change | ✅ COMPLIANT |
| listas-refetch / Returning after a dropped connection shows up-to-date data | Data missed while disconnected appears after reconnect | `listasCollection.test.ts > reflects a change made on another device once the post-reconnect refetch resolves`; `articulosCollection.test.ts > (same)` | ✅ COMPLIANT |

**Compliance summary**: 29/29 scenarios have a passing covering test, 0 untested, 0 failing. One of them (W2) is met only at the predicate + vendor level, not through the translator; classified COMPLIANT because every literal clause of the scenario is asserted by a passing test against real production code, and the validator contract requires completed == total for any passing verdict. 17/17 requirements implemented with at least one passing covering test.

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Domain-typed CRUD surface | ✅ Implemented | Six functions per repository; every return goes through `listaDesdeFila` / `articuloDesdeFila`. |
| Bidirectional row-domain mapping | ✅ Implemented | Mapping matches the spec table field-for-field; write payloads omit server-managed audit columns. |
| Exact preservation of the purchase tri-state | ✅ Implemented | `articuloDesdeFila` copies `is_bought`/`bought_at`/`bought_by` verbatim, no derivation. |
| Hard delete with no soft-delete filter | ✅ Implemented | `rg deleted_at` over production `infrastructure/` matches only the two comments documenting its absence. `eliminar*` = `.delete().eq('id', id)`. |
| One `queryCollectionOptions` collection per table | ✅ Implemented | `queryKey`, `queryFn`, `queryClient`, `getKey: (x) => x.id` on both factories. |
| Mutation handlers delegate to the repository | ✅ Implemented | `onInsert`/`onUpdate`/`onDelete` call the repository only; no `insforge.database` reference in either collection file. |
| High `staleTime` | ✅ Implemented | `staleTime: Infinity` on both. |
| Optimistic mutations revert on server rejection | ✅ Implemented | Rejection propagates from the repository; TanStack DB rolls back (proven at runtime). |
| Household-parameterized connect and subscribe | ✅ Implemented | `iniciarSuscripcionHogar(householdId, colecciones, alReportar?)`; channel `household:${householdId}`. |
| Six-event translation into direct writes | ✅ Implemented | `writeUpsert` for the four insert/update events; `writeDelete` for `item.delete`; cascade + `writeDelete` for `list.delete`. See W1 for the runtime-evidence gap on standalone `item.delete`. |
| Registered realtime error handler | ✅ Implemented | `insforge.realtime.on('error', manejadorError)`; handler only calls `alReportar`. |
| No query invalidation on any realtime event | ✅ Implemented | No `invalidateQueries`/`refetch` reference anywhere in `realtime.ts`. |
| Cascade-safe batch membership filtering | ✅ Implemented | `estaSincronizado` reads `_state.syncedData.has(clave)`; guards `item.delete` (L131) and the lista delete (L177); cascade keys are read from `syncedData` so the batch cannot contain absent keys. |
| Envelope parsing via one narrow adapter | ✅ Implemented | `filaDesdeMensaje`: `const { meta, ...fila } = mensaje`, `meta` shape guard, `senderType` guard, `bought_at`/`bought_by` normalized with `??`, never reads `senderId`. |
| Refetch on window focus regain | ✅ Implemented | `refetchOnWindowFocus: 'always'` on both. |
| Refetch on reconnect | ✅ Implemented | `refetchOnReconnect: 'always'` on both. |
| Returning after a dropped connection shows up-to-date data | ✅ Implemented | Consequence of the two options above; proven at runtime with a changed `mockResolvedValueOnce`. |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 `writeUpsert` for insert/update; no `writeInsert`/`writeUpdate` in production | ✅ Yes | `realtime.ts:103` is the single write call for the four upsert events. `rg writeInsert|writeUpdate` over production files matches only the D1 comment. `writeUpdate` appears in tests only. |
| D2 guard reads `_state.syncedData`; `has()` divergence pinned | ✅ Yes | `estaSincronizado` at `realtime.ts:33-38`. Pin test would fail if the predicate used `has()`. Note S2/S3: a second raw `_state.syncedData` read exists at `realtime.ts:164` (prescribed by the D4 diagram), and nothing pins that the handlers route through the predicate rather than `has()`. |
| D3 one direct write per message; `writeBatch` only in the cascade | ✅ Yes | `writeBatch` appears once (`realtime.ts:170`) inside `crearManejadorBorradoLista`; tests spy `writeBatch` and assert it is not called for single-row events. |
| D4 cascade deletes `articulos` first, `lista` second | ✅ Yes (source) | `realtime.ts:163-178`: articulos batch, then `listas.utils.writeDelete`. No test asserts the order (W3). |
| D5 factories taking `queryClient`; `householdId` parameter; no `@/app/**` / `@/shared/hogar` in `infrastructure/` | ✅ Yes | `crearListasCollection(queryClient, householdId)`, `crearArticulosCollection(queryClient, householdId)`, `iniciarSuscripcionHogar(householdId, ...)`. Import audit of the five production files: only `@/shared/api/insforge`, `../domain/*`, sibling `./` modules, and vendor packages (`@tanstack/react-db`, `@tanstack/query-db-collection`, `@tanstack/react-query` type, `@insforge/sdk` types). Zero matches for `@/app`, `shared/hogar`, `/application`, `/ui`, `@/modules` outside comments. |
| D6 `refetchOnWindowFocus: 'always'`, `refetchOnReconnect: 'always'`; tests assert a real `queryFn` re-invocation | ✅ Yes | Both options on both collections. All eight Phase 4 tests assert the mocked repository call count or collection data; none asserts the `'always'` literal. |
| D7 realtime `error` handler reports and never throws/invalidates/retries | ✅ Yes | `manejadorError` at `realtime.ts:239-240` is a single `alReportar({ tipo: 'socket', causa })` call; default reporter `console.error`. |
| Design: `SocketMessage` imported from `@insforge/sdk`, not declared locally | ✅ Yes | `realtime.ts:2`. |
| Design: `detener()` idempotent, removes six handlers + `error`, unsubscribes, does not `disconnect()` | ✅ Yes (source) | `realtime.ts:250-268`. No test exercises `detener()` (W4). |

**Design coherence**: 9/9 decisions followed in source; 2 of them (D4 ordering, `detener()` lifecycle) lack runtime evidence.

### Documented deviations (apply-progress.md) — assessment
| Deviation | Justified? | Still satisfies the spec? |
|---|---|---|
| Null-vs-missing normalization lives in `filaDesdeMensaje`, not `articuloDesdeFila` | Yes — Phase 1 files were out of Phase 3's edit scope, and `listas-realtime/spec.md` assigns this responsibility to the adapter in its own requirement text | Yes — `realtime.ts:84-85` uses `??`; the scenario test passes. Consequence: `articuloDesdeFila` alone still yields `boughtAt: undefined` for an absent key, but every socket row passes through the adapter first and PostgREST rows always carry the column. |
| `filaDesdeMensaje` throws for a non-`'system'` sender / malformed `meta` instead of returning a row | Yes — design named the drop-and-report behavior without naming a variant; `'mensaje-ilegible'` is the closest declared `FalloRealtime` | Yes — not a spec scenario; tested by two extra tests. |
| `estaSincronizado` is exported | Yes — design D2 requires a pin test that calls it directly; task 3.8 names it | Yes. |
| `@tanstack/react-db` instead of `@tanstack/db` for `Collection`/`createCollection` | Yes — `@tanstack/db` is transitive only; `react-db` re-exports it; tasks.md 3.15 already records this | Yes. |
| Phase 2 tests moved to shared `let collection` + `afterEach(cleanup)` | Yes — `'always'` subscribes each collection's `QueryClient` to the process-wide `focusManager`/`onlineManager`; uncleaned collections inflate call counts | Yes — test-only; every Phase 2 assertion is unchanged. |
| `.get()` assertions changed `toEqual` → `toMatchObject` | Yes — TanStack DB attaches virtual `$`-prefixed props | Yes — the domain fields are still asserted. |

### Task 023 residual (wire null handling)
Design open question "end-to-end JSON null handling for `bought_by` / `bought_at` on the live wire" remains **UNRESOLVED by design**. Confirmed that the adapter absorbs both documented outcomes: `realtime.ts:84-85` maps an absent key and an explicit `null` to `null`, and `realtime.test.ts > treats a missing bought_at and an explicit bought_at: null identically` proves it. This is not a defect and is not counted as a finding; only a live client can close it.

### Architecture boundaries (docs/03-Arquitectura.md §3, §3.2)
`infrastructure/` may import `domain/` and `shared/api` only. Every import in the five production files complies (see D5 row). Test files mock `@/shared/api/insforge` or the sibling repository module, never the vendor package, per the `use-sesion.test.ts` convention. §6 exempts `infrastructure/` from mandatory unit tests; this change tests it anyway, which is stricter than the doc, not a violation.

### Hard delete
`rg deleted_at frontend/src/modules/listas/infrastructure -g '!*.test.ts'` → two comment lines only (`listasRepository.ts:86`, `articulosRepository.ts:104`). Both `eliminar*` functions chain exactly `.delete().eq('id', id)`; the regression tests assert `eq` called once with `('id', ...)` and no `deleted_at` argument anywhere in the recorded chain, and would fail on an added `.is('deleted_at', null)` (fake has no `is`) or `.eq('deleted_at', ...)` (call count).

### Language convention
Comments and error strings in English; identifiers, test fixture values, and event/type names in Spanish as required. One run-on comment sentence at `realtime.ts:55-59` (S6).

---

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | "TDD Cycle Evidence" table present for all four phases in apply-progress.md |
| All tasks have tests | ✅ | 37/37 tasks map to one of the 5 test files (RED tasks) or to GREEN/REFACTOR work covered by them |
| RED confirmed (tests exist) | ✅ | 5/5 test files exist and run (52 tests) |
| GREEN confirmed (tests pass) | ✅ | 52/52 infrastructure tests and 151/151 suite pass on independent execution |
| Triangulation adequate | ✅ | Every multi-scenario requirement has one test per scenario; both collections mirror each test; tri-state covered with both branches; echo vs fresh insert; missing vs null |
| Safety Net for modified files | ⚠️ | Evidence table has no explicit SAFETY NET column. Phase 4 (the only phase that modified existing files) records the pre-slice baseline (22 files / 143 tests) and zero regressions, which is equivalent evidence. |

**TDD Compliance**: 5/6 checks passed (one derived rather than reported). Process note: Phase 3 RED evidence was produced by temporarily removing an already-written implementation; the failure was observed, but the order was implementation-then-RED.

Mutation-testing claims in apply-progress (D2 guard removal → `DeleteOperationItemNotFoundError`; D1 `writeInsert` → 3 failures incl. 3.2b) were not re-run here (verify is read-only on source); they are consistent with the assertion structure of tests 3.6 and 3.2b as read.

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 52 | 5 | Vitest 4.1.11 + jsdom; `waitFor` from @testing-library/react (no render) |
| Integration | 0 | 0 | @testing-library/react installed, not used here |
| E2E | 0 | 0 | not installed |
| **Total** | **52** | **5** | |

### Changed File Coverage
`pnpm exec vitest run src/modules/listas/infrastructure --coverage.enabled --coverage.provider=v8 --coverage.include='src/modules/listas/infrastructure/**'`

| File | Line % | Branch % | Uncovered Lines | Rating |
|------|--------|----------|-----------------|--------|
| `listasCollection.ts` | 100 | 100 | — | ✅ Excellent |
| `articulosCollection.ts` | 100 | 100 | — | ✅ Excellent |
| `listasRepository.ts` | 88.9 | 75 | L66, L80 (`throw error` in `insertarLista`/`actualizarLista`) | ⚠️ Acceptable |
| `articulosRepository.ts` | 88.9 | 75 | L82, L98 (`throw error` in `insertarArticulo`/`actualizarArticulo`) | ⚠️ Acceptable |
| `realtime.ts` | 80.6 | 73.9 | **L135** (`writeDelete` in standalone `item.delete` handler), L137, L181 (catch paths), **L254-266** (`detener()`) | ⚠️ Acceptable |

**Average changed file coverage**: 91.7% lines (aggregate 85% over 120 statements). No file below 80%.

### Assertion Quality
| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| `realtime.test.ts` | 189-199 | `expect(() => emitirEvento(...)).not.toThrow()` | Trivially true (handler catches everything); the companion `toMatchObject({ updatedAt, updatedBy })` at L201 is the load-bearing assertion, so the test still discriminates | — (note only) |
| `realtime.test.ts` | 411-418 | `expect(() => filaDesdeMensaje(mensajeIlegible)).toThrow()` | Does not assert which error; acceptable for a defense-in-depth guard | — (note only) |
| `listasCollection.test.ts` / `articulosCollection.test.ts` | 114 / 122 | `expect(opciones?.staleTime).toBe(Infinity)` | Config literal; the accompanying `toHaveBeenCalledTimes(1)` would also hold under the default `staleTime` because nothing in the test triggers a staleness check | SUGGESTION (S1) |

No tautologies, no ghost loops (the `for (const ... of listas)` loops at `listasRepository.test.ts:135` / `articulosRepository.test.ts:177` follow a `toEqual([two items])` that guarantees non-empty), no smoke-only tests, no mock-heavy files.

**Assertion quality**: 0 CRITICAL, 0 WARNING

### Quality Metrics
**Linter**: ✅ No errors (`pnpm lint` exit 0)
**Type Checker**: ✅ No errors (`pnpm exec tsc --noEmit` exit 0)
**Formatter**: ✅ (`pnpm check` exit 0)

---

### Issues Found

**CRITICAL**: None.

**WARNING**:
- **W1 — standalone `item.delete` has no runtime evidence.** `realtime.ts:135` (`coleccion.utils.writeDelete(clave)` inside `crearManejadorBorrado`) is never executed by any test: every `item.delete` message in the suite targets a key the cascade already removed, so the guard short-circuits. A `crearManejadorBorrado` that never deleted anything would pass all 151 tests. The requirement "Six-event translation into direct writes" names `item.delete` as MUST; apply-progress task 3.3 claims "full six-event coverage" but that holds for `item.delete` only on the no-op branch. No spec scenario is dedicated to it, so the scenario count is unaffected. Fix: one test — seed a synced `Articulo`, emit `item.delete` for it, assert `articulos.get(id)` is `undefined` and `alReportar` was not called.
- **W2 — scenario "A cascade-orphaned delete does not discard a concurrent legitimate write in the same batch" is met only at the predicate level.** The covering test hand-builds the `writeBatch` and calls `estaSincronizado` itself; `iniciarSuscripcionHogar` is not on the path. Under D3 (one write per message) the translator never queues a delete and an update in the same batch, so the scenario's GIVEN is unreachable through production code. Either add a translator-level interleaving test (`list.delete` → cascaded `item.delete` → `item.update` for an unrelated item via `emitirEvento`, assert the update landed and `alReportar` not called) or reconcile the spec wording with D3 at archive time.
- **W3 — D4 cascade ordering is not pinned by a test.** Design's testing strategy says "Ordering: articulos batch commits before the lista delete" will be proven; test 3.6 asserts only the end state. Source order is correct (`realtime.ts:163-178`). A spy on `articulos.utils.writeBatch` and `listas.utils.writeDelete` comparing `mock.invocationCallOrder` closes this.
- **W4 — `detener()` is untested.** `realtime.ts:250-268` (0% coverage) implements design-specified behavior: idempotence, removal of the seven handlers, `unsubscribe(canal)` without `disconnect()`. Under Strict TDD this is production behavior with no RED test. Not a spec scenario.

**SUGGESTION**:
- **S1** — The `staleTime` scenario is pinned by the config literal (`opciones?.staleTime).toBe(Infinity)`). Defensible: `staleTime` is observer-scoped, so a behavioral probe via a second observer would use its own default and not discriminate. Leave as is, but the comment should say the literal is the load-bearing assertion.
- **S2** — A second raw `_state.syncedData` read exists at `realtime.ts:164` (cascade key enumeration). D2's mitigation talks about confining the internal to one named predicate; D4's diagram prescribes this read. Consider a sibling helper (e.g. `clavesSincronizadas`) so a `@tanstack/db` upgrade touches one place.
- **S3** — Nothing pins that the delete handlers route through `estaSincronizado` rather than `collection.has()`; test 3.6 passes with either because no optimistic state is present. A translator-level test that optimistically `.delete()`s key K (leaving K in `syncedData` but not in `has()`) and then emits a server `item.delete` for K would distinguish (`estaSincronizado` → row removed from `syncedData`; `has()` → row lingers).
- **S4** — `filaDesdeMensaje` normalizes both `bought_at` and `bought_by`, but only `bought_at` is tested, and no test drives an `item.insert` message with the key absent end-to-end to `boughtAt: null`.
- **S5** — apply-progress.md says "36/36" / "All 36 tasks" in the Phase 4 summary; tasks.md has 37 checkboxes (9 + 7 + 16 + 5). Fix the arithmetic at archive.
- **S6** — `realtime.ts:55-59` comment is a run-on sentence ("...instead of `null` for a list event with no purchase fields at all, the extra `null` keys are harmless"); a sentence break after `null` is missing.
- **S7** — `throw error` branches of `insertar*`/`actualizar*` are uncovered (repositories L66/L80, L82/L98); the read and delete paths already prove the pattern.

### Verdict
**PASS WITH WARNINGS**
All 37 tasks complete, suite 22 files / 151 tests green, tsc/lint/prettier exit 0, 17/17 requirements implemented, 29/29 scenarios with a passing covering test (one at predicate level only, W2), all seven design decisions followed in source, boundaries clean, hard delete confirmed. No CRITICAL findings. Four WARNINGs are runtime-evidence gaps (standalone `item.delete`, hand-built batch scenario, D4 ordering, `detener()`), none of which is a spec violation or a regression test that cannot fail; they can be closed with four small tests before or after archive at the orchestrator's discretion.
