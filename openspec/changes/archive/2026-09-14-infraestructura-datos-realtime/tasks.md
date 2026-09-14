# Tasks: Realtime data infrastructure for shared shopping lists

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 980-1420 (350-480 + 250-370 + 300-420 + 80-150) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (043) → PR 2 (044) → PR 3 (045) → PR 4 (046) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Note: session preflight sets `review_budget_lines: 800` for this change, overriding `openspec/config.yaml`'s `400` (not edited — session value is authoritative). Each slice individually fits inside 800 lines; only the four-slice total exceeds it, which is why they are chained rather than combined.

### Suggested Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|----|-----------------------|------------------|--------------------|
| 1 | `listasRepository.ts` + `articulosRepository.ts`: domain-typed CRUD, mapping, hard delete | PR 1 | `cd frontend && pnpm test -- listasRepository.test.ts articulosRepository.test.ts` | N/A — pure PostgREST mocks, no live backend in this change | Revert both files + tests; nothing else in the repo imports them yet |
| 2 | `listasCollection.ts` + `articulosCollection.ts`: `queryCollectionOptions`, optimistic mutations | PR 2 | `cd frontend && pnpm test -- listasCollection.test.ts articulosCollection.test.ts` | N/A — in-memory `Collection` + fresh `QueryClient` per test, no real socket | Revert both files + tests; repositories from PR 1 remain independently valid |
| 3 | `realtime.ts`: subscription, six-event translation, cascade-safe filtering | PR 3 | `cd frontend && pnpm test -- realtime.test.ts` | N/A — no E2E runner; live InsForge WebSocket verification stays deferred (same gap as task 023) | Revert `realtime.ts` + tests; collections keep working on initial load only |
| 4 | Add `refetchOnWindowFocus`/`refetchOnReconnect: 'always'` to both collections | PR 4 | `cd frontend && pnpm test -- listasCollection.test.ts articulosCollection.test.ts` | N/A — dispatched `focus`/`online` events in jsdom, no real network drop | Remove the two option lines from both collection files; PR 2 behavior is restored |

## Phase 1: `listasRepository.ts` / `articulosRepository.ts` (PR 1 — task 043)

Done when: no raw row shape escapes `infrastructure/`.

- [x] 1.1 RED `frontend/src/modules/listas/infrastructure/listasRepository.test.ts`: round-trip mapping (`listaDesdeFila`/`filaDesdeLista`) preserves all 7 fields; update payload uses `name` not `nombre`. *(Req: Bidirectional row-domain mapping — both scenarios)*
- [x] 1.2 RED same file: `obtenerListas` returns `Lista[]` with no `name`/`household_id`; `insertarLista` returns a `Lista`. *(Req: Domain-typed CRUD surface — both scenarios, list side)*
- [x] 1.3 RED same file: `eliminarLista` issues a PostgREST delete with no `deleted_at` filter and no filter beyond id. *(Req: Hard delete — "Deleting a list issues no soft-delete filter"; REGRESSION)*
- [x] 1.4 RED `frontend/src/modules/listas/infrastructure/articulosRepository.test.ts`: round-trip mapping; unpurchased row → `comprado: false, boughtAt: null, boughtBy: null`; purchased row → all three populated exactly as read. *(Req: Exact preservation of the purchase tri-state — both scenarios; REGRESSION for `comprado_coherente`)*
- [x] 1.5 RED same file: `obtenerArticulos` returns `Articulo[]` with no `content`/`is_bought`/`list_id`; `insertarArticulo` returns an `Articulo`; update payload key is `content` not `contenido`. *(Req: Domain-typed CRUD surface + "An update payload uses table column names")*
- [x] 1.6 RED same file: `eliminarArticulo` issues a PostgREST delete with no `deleted_at` filter. *(Req: Hard delete — "Deleting an item issues no soft-delete filter"; REGRESSION)*
- [x] 1.7 GREEN `frontend/src/modules/listas/infrastructure/listasRepository.ts`: implement `listaDesdeFila`, `filaDesdeLista`, `obtenerListas`, `insertarLista`, `actualizarLista`, `eliminarLista` against `@/shared/api/insforge` (read-only import) to pass 1.1-1.3.
- [x] 1.8 GREEN `frontend/src/modules/listas/infrastructure/articulosRepository.ts`: implement `articuloDesdeFila`, `filaDesdeArticulo`, `obtenerArticulos`, `insertarArticulo`, `actualizarArticulo`, `eliminarArticulo`; pass the tri-state through unchanged (no derivation) to pass 1.4-1.6.
- [x] 1.9 REFACTOR both files: dedupe repeated PostgREST error propagation only if trivial; confirm no `deleted_at` reference anywhere; run `cd frontend && pnpm test` and `cd frontend && pnpm exec tsc --noEmit`.

## Phase 2: `listasCollection.ts` / `articulosCollection.ts` (PR 2 — task 044)

Done when: collections load, and optimistic mutations revert if the server rejects.

- [x] 2.1 RED `frontend/src/modules/listas/infrastructure/listasCollection.test.ts` + `articulosCollection.test.ts`: collection built via `queryCollectionOptions` loads from `queryFn`; record retrievable by `getKey` (`id`). *(Req: One `queryCollectionOptions` collection per table)*
- [x] 2.2 RED same files: `onInsert` calls `insertarLista`/`insertarArticulo` with no other network call; `onDelete` calls `eliminarLista`/`eliminarArticulo` with the id. *(Req: Mutation handlers delegate to the repository — both scenarios)*
- [x] 2.3 RED same files: with `staleTime: Infinity`, a record written via `writeUpdate` survives — no automatic background refetch fires from staleness alone within the session. *(Req: High `staleTime` to avoid clobbering realtime writes)*
- [x] 2.4 RED same files: a rejected `onUpdate` reverts `contenido` to the prior confirmed value; a rejected `onDelete` restores the removed `Lista`. *(Req: Optimistic mutations revert on server rejection — both scenarios)*
- [x] 2.5 GREEN `frontend/src/modules/listas/infrastructure/listasCollection.ts`: `crearListasCollection(queryClient, householdId)` factory (D5) — `queryKey: ['listas', householdId]`, `getKey: (x) => x.id`, `staleTime: Infinity`, `onInsert`/`onUpdate`/`onDelete` delegating to `listasRepository`. Pass 2.1-2.4.
- [x] 2.6 GREEN `frontend/src/modules/listas/infrastructure/articulosCollection.ts`: `crearArticulosCollection(queryClient, householdId)` factory, household-wide `queryKey: ['articulos', householdId]` (D5), same option shape delegating to `articulosRepository`. Pass 2.1-2.4.
- [x] 2.7 REFACTOR both files: confirm neither imports `@/app/**` or `@/shared/hogar` (§2, §3.2); run `cd frontend && pnpm test` and `cd frontend && pnpm exec tsc --noEmit`.

## Phase 3: `realtime.ts` (PR 3 — task 045)

Done when: a change made on another device appears without reloading. `SocketMessage` is imported from `@insforge/sdk` (dist verified present — decision 8), never declared locally.

- [x] 3.1 RED `frontend/src/modules/listas/infrastructure/realtime.test.ts`: `iniciarSuscripcionHogar('a1b2c3', colecciones)` subscribes to channel `'household:a1b2c3'`; no household id read from any other module. *(Req: Household-parameterized connect and subscribe)*
- [x] 3.2 RED same file: a `list.insert` message for an unknown list leaves that list in `listasCollection`'s synced state, applied as a single `writeUpsert` with no `writeBatch` wrapper (D1 + D3), and triggers no query invalidation or refetch. *(Req: Six-event translation — "A list.insert event lands in the list collection")*
- [x] 3.2b RED same file: a `list.insert` echo for a list ALREADY in synced state, whose `updated_at`/`updated_by` differ from the stored value, raises no error and leaves the message's values in synced state. This is the regression that `writeInsert` would fail with `DuplicateKeySyncError` after `ctx.begin()` (D1). *(Req: Six-event translation — "A list.insert echo for a row this client already inserted does not throw")*
- [x] 3.3 RED same file: an `item.update` message for an existing item leaves its changed fields in `articulosCollection`'s synced state as a single `writeUpsert`, no batch wrapper, no invalidation (D1 + D3); also cover `list.update`, `list.delete`, `item.insert`, `item.delete` reaching the correct collection. *(Req: Six-event translation — "An item.update event lands in the item collection" plus full six-event coverage)*
- [x] 3.4 RED same file: subscription registers an `error` handler; emitting `error` invokes it; nothing unhandled escapes. *(Req: Registered realtime error handler)*
- [x] 3.5 RED same file: a spy on `queryClient.invalidateQueries` proves it is never called after handling a `list.update` and an `item.insert`. *(Req: No query invalidation on any realtime event)*
- [x] 3.6 RED same file: a `list.delete` event followed by `item.delete` events for its two already-cascaded items completes without throwing `DeleteOperationItemNotFoundError`. *(Req: Cascade-safe batch membership filtering — "A list delete followed by its already-cascaded item deletes..."; REGRESSION for task 019 ordering)*
- [x] 3.7 RED same file: one already-cascaded item delete plus one concurrent `item.update` for an unrelated item in the same `articulosCollection.writeBatch` — the unrelated update is applied, nothing discards it. *(Req: Cascade-safe batch membership filtering — "A cascade-orphaned delete does not discard...")*
- [x] 3.8 RED same file: pin the divergence — after an optimistic insert, `collection.has(key) === true` while `estaSincronizado(collection, key) === false`; an `item.delete` for a different already-cascaded key in the same batch does not throw, and the optimistic item's presence never justifies emitting that delete. *(Req: Cascade-safe batch membership filtering — "A guard based on optimistic presence alone is insufficient"; REGRESSION for design D2)*
- [x] 3.9 RED same file: `filaDesdeMensaje` maps a message missing `bought_at` and one with `bought_at: null` to the same `boughtAt: null`. *(Req: Envelope parsing — "A missing purchase field and an explicit null...")*
- [x] 3.10 RED same file: `filaDesdeMensaje` produces identical row data whether `meta.senderId` is absent or `null`. *(Req: Envelope parsing — "meta.senderId presence does not affect translation")*
- [x] 3.11 RED same file: a message failing the `typeof meta.messageId === 'string'` shape guard reports `FalloRealtime{tipo:'mensaje-ilegible'}` and is dropped (defense against a future `meta`-column collision, design guard #3).
- [x] 3.12 GREEN `frontend/src/modules/listas/infrastructure/realtime.ts`: implement `filaDesdeMensaje` — spread minus `meta`, validate `meta` shape, drop non-`'system'` `senderType`. Pass 3.9-3.11.
- [x] 3.13 GREEN same file: implement `estaSincronizado(coleccion, clave)` reading `coleccion._state.syncedData.has(clave)` (D2); filter `writeDelete`/`writeUpdate` batch membership through it before emitting. Pass 3.6-3.8.
- [x] 3.14 GREEN same file: implement `iniciarSuscripcionHogar` — connect, subscribe, six `.on()` handlers each emitting one direct write per message via `writeUpsert` for insert/update (D1, D3 — one write per message, `writeBatch` only for the cascade); `list.delete` cascade runs the articulos batch first, then the lista delete (D4); `error` handler calls `alReportar` (default `console.error`), never throws/invalidates/retries (D7). Pass 3.1-3.5.
- [x] 3.15 REFACTOR: confirm `realtime.ts` imports only `@/shared/api/insforge` (read-only), `./listasRepository`, `./articulosRepository`, domain types from `frontend/src/modules/listas/domain/` (read-only), and the `Collection` type from `@tanstack/react-db` (which re-exports `@tanstack/db`; the latter is not a direct dependency) — no `@/shared/hogar`, no `@/app/**` (§3.2); run `cd frontend && pnpm test` and `cd frontend && pnpm exec tsc --noEmit`.

## Phase 4: Refetch flags on both collections (PR 4 — task 046)

Done when: returning after losing connection shows up-to-date data.

- [x] 4.1 RED `frontend/src/modules/listas/infrastructure/listasCollection.test.ts` + `articulosCollection.test.ts`: with `staleTime: Infinity`, dispatching a recognized focus-regain event triggers a `queryFn` invocation (spy call count, not the `'always'` literal); no focus event means no extra invocation. *(Req: Refetch actually occurs on window focus regain — both scenarios)*
- [x] 4.2 RED same files: dispatching a recognized `online` event triggers a `queryFn` invocation inside the stale window. *(Req: Refetch actually occurs on reconnect)*
- [x] 4.3 RED same files: simulate a dropped connection during which a change happened elsewhere, then reconnect — the resulting refetch resolves and the collection reflects the missed change. *(Req: Returning after a dropped connection shows up-to-date data)*
- [x] 4.4 GREEN `listasCollection.ts` + `articulosCollection.ts`: add `refetchOnWindowFocus: 'always'` and `refetchOnReconnect: 'always'` (D6) to both `queryCollectionOptions` configs. Pass 4.1-4.3.
- [x] 4.5 REFACTOR: confirm no test in the suite asserts only the `'always'` config literal instead of an actual `queryFn` invocation; run `cd frontend && pnpm test` and `cd frontend && pnpm exec tsc --noEmit` across all four slices together.

## Coverage

All 17 requirements / 28 scenarios across `listas-repository` (4/8), `listas-collections` (4/6), `listas-realtime` (6/10), `listas-refetch` (3/4) are covered above. Threat matrix: N/A per design (no routing/shell/subprocess/VCS boundary) — no threat-matrix tasks required.

## Notes

- Task 045 (Phase 3) is functionally inert at runtime until task 047 (`useHogar`) supplies a real `householdId` — declared in the proposal as risk #3, not a blocker for this change's own tests.
- No migration, schema, or persisted-data change in this slice.
