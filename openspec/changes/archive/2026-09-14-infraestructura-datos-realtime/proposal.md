# Proposal: Realtime data infrastructure for shared shopping lists

## Intent

Deliver ADuo tasks 043 → 046: the `infrastructure/` layer of `modules/listas`. The product promise is a
shopping list two people share, where a change made on another device appears **without reloading**.
Today nothing below `domain/` exists: `frontend/src/modules/listas/infrastructure/` is empty, so the
domain types are unreachable from the backend and no live update can arrive.

This slice closes that gap end to end: PostgREST repositories that return domain types, TanStack DB
collections that hold them, a household-channel subscription translated into direct writes, and a
recovery refetch so a dropped socket does not leave the app showing a silent stale past.

## Scope

### In Scope

- `listasRepository.ts` / `articulosRepository.ts`: CRUD against PostgREST plus row ↔ domain mapping (043).
- `listasCollection.ts` / `articulosCollection.ts`: `queryCollectionOptions` with a high `staleTime`, `getKey`,
  and `onInsert` / `onUpdate` / `onDelete` wired to the repositories (044).
- `realtime.ts`: connect, subscribe to `household:<uuid>`, translate the six events into batched direct
  writes, register the realtime `error` handler (045).
- `refetchOnWindowFocus` / `refetchOnReconnect` on the collection options (046).
- One narrow `filaDesdeMensaje` adapter absorbing the unverified wire-format details.
- Colocated Vitest tests, RED first, including the cascade-ordering regression and a delete-has-no-soft-delete-filter regression.

### Out of Scope

- Application layer: `useListas`, `useArticulos`, `useHogar` (tasks 047, 048) and who owns the subscription lifecycle.
- All UI and routes (task 049 onward).
- Live-client verification of task 023's remaining unknown (null handling on the wire); design absorbs it defensively.
- `modules/listas/index.ts` barrel, backend/schema changes, and any realtime work for module 2.

## Capabilities

### New Capabilities

- `listas-repository`: PostgREST access returning domain types; hard-delete semantics; no raw row shape escapes.
- `listas-collections`: TanStack DB collections, key derivation, high `staleTime`, optimistic mutation handlers with revert.
- `listas-realtime`: household-channel subscription, message adaptation, and safe translation into direct writes.
- `listas-refetch`: focus and reconnect recovery of collection data.

### Modified Capabilities

- None. `lista-domain`, `articulo-domain` and `busqueda-domain` are unchanged.

## Approach

File layout, per `docs/03-Arquitectura.md` §7:

```
modules/listas/infrastructure/
  listasRepository.ts      (043)
  articulosRepository.ts   (043)
  listasCollection.ts      (044)
  articulosCollection.ts   (044)
  realtime.ts              (045 + 046 flags live on the collections)
```

### Settled decisions carried into design

1. **`householdId` is a parameter, not a lookup.** §3.2 forbids `infrastructure/` from importing
   `shared/hogar`, so `realtime.ts` cannot resolve the household itself; its exported surface takes
   `householdId` as an argument (for example `iniciarSuscripcionHogar(householdId, colecciones)`).
   **Honest consequence: task 045 is functionally inert until task 047 (`useHogar`) exists**, even
   though the task dependency graph declares no such edge. This keeps provider / hook / singleton
   ownership open for 047-048.
2. **Refetch flags use `'always'`, never `true`.** Both flags pass through `queryCollectionOptions` to
   TanStack Query, whose default `true` refetches *only when the query is already stale* — and task
   044's deliberately high `staleTime` is exactly what prevents staleness. `true` would make task 046 a
   silent no-op.
3. **One shared `realtime.ts`, not per-entity modules.** Exactly one channel per household carries both
   `list.*` and `item.*`; a single `subscribe()` dispatching by event name avoids ambiguous
   double-subscription semantics. Cost accepted: one file knows about two collections.
4. **Membership filtering before the batch is emitted** (see the hard constraint below).
5. **Delivery: four chained PRs, `stacked-to-main`**, on the four task boundaries. Tradeoff accepted by the
   user: `main` will temporarily hold repositories without collections.

### Hard constraint — an absent key aborts the whole batch

Verified in installed `@tanstack/query-db-collection@1.2.6`, `src/manual-sync.ts`: `validateOperations`
(lines 107-136) throws `DeleteOperationItemNotFoundError` when a `delete` key is absent from
`syncedData`, `UpdateOperationItemNotFoundError` for `update`, and `DuplicateKeyInBatchError` for two
operations on one key in one batch. `performWriteOperations` (lines 139-151) runs that validation over
the **whole normalized batch before `ctx.begin()`**, before any write applies.

Task 045's own doc understates this as "a console full of errors". The real behavior is that **one absent
key discards every other operation in the batch**. Combined with task 019's verified cascade ordering
(`list.delete` is published *before* the `item.delete` events for rows the FK cascade already removed), a
routine list deletion can silently drop concurrent legitimate writes.

`try`/`catch` around the batch is **not** a sufficient mitigation — the throw discards the survivors too.
This change commits to filtering operations against collection membership **before** emitting the batch.

**Subtlety design must resolve, not assume away**: `validateOperations` reads
`collection._state.syncedData`, while public `collection.has(key)` (`@tanstack/db@0.8.1`,
`src/collection/index.ts:541`) reads the **combined** view including optimistic state. A guard written
with `has()` can pass while `syncedData` still lacks the key — for example an optimistically inserted row
not yet confirmed by the server.

### Other binding constraints

- **Hard delete.** Deletion is physical; no `deleted_at IS NULL` filter exists anywhere. A regression test
  must assert delete calls carry no soft-delete filter.
- **Never invalidate the query on a realtime event.** Invalidation triggers a full table refetch per changed
  row — precisely what this layer exists to avoid.
- **Layering.** TanStack Query does the initial load; the WebSocket applies changes. TanStack Query has no
  WebSocket transport.
- **A dropped WebSocket does not replay what was missed**; without the reconnect refetch the app shows a
  silent stale past, which is worse than a visible error.
- **`writeBatch` is per-collection**, not cross-collection: a list + item cascade needs two separate calls.
- **Adapter boundary.** Research settled the envelope (`{ meta, ...row fields at top level }`,
  `senderType === 'system'`) but left `bought_by` / `bought_at` null handling UNRESOLVED. `filaDesdeMensaje`
  absorbs it: treat a missing key and an explicit `null` as semantically identical, never use key presence
  as a signal, and guard against a literal `meta` key appearing among row columns.

### Row → domain mapping (verified against the applied SQL)

`shopping_lists` → `Lista`: `id`→`id`, `household_id`→`householdId`, `name`→`nombre`,
`created_at`→`createdAt`, `created_by`→`createdBy`, `updated_at`→`updatedAt`, `updated_by`→`updatedBy`.

`shopping_items` → `Articulo`: `id`→`id`, `list_id`→`listaId`, `household_id`→`householdId`,
`content`→`contenido`, `is_bought`→`comprado`, `bought_by`→`boughtBy`, `bought_at`→`boughtAt`,
`created_at`→`createdAt`, `created_by`→`createdBy`, `updated_at`→`updatedAt`, `updated_by`→`updatedBy`.

Pure renames both directions. The schema's `comprado_coherente` CHECK ties `is_bought` / `bought_at` /
`bought_by` together; the mapper must preserve that tri-state exactly.

## Affected Areas

| Path | Impact |
|---|---|
| `frontend/src/modules/listas/infrastructure/` | New directory (5 modules + colocated tests) |
| `frontend/src/app/providers/query.tsx` | Read-only reference; its `staleTime` comment defers to 044 |
| `frontend/src/shared/api/insforge.ts` | Consumed only; unchanged |
| `docs/tareas/043-046` | Status updates at archive |

## Risks

| # | Severity | Risk | Mitigation |
|---|---|---|---|
| 1 | HIGH | An absent key aborts the entire `writeBatch`, discarding concurrent legitimate writes | Filter against collection membership before emitting; cascade-ordering regression test |
| 2 | HIGH | `syncedData` vs `has()` divergence makes the guard pass while validation still throws | Design must resolve this explicitly, with a test for the optimistic-insert case |
| 3 | HIGH | **Task 045 is inert until task 047 exists** — the dependency graph does not declare this edge | State it openly; `householdId` injected as a parameter so 047/048 can own the lifecycle |
| 4 | MEDIUM | Wire envelope typed from SDK schema and docs, not a live client (task 023 still blocked) | One narrow `filaDesdeMensaje`; a live surprise is a one-function fix |
| 5 | MEDIUM | Nullable-column null handling unresolved on the wire | Treat missing and explicit `null` as identical for `bought_by` / `bought_at` |
| 6 | MEDIUM | High `staleTime` + `refetchOn*: true` silently no-ops, defeating task 046 | `'always'` on both flags; test via dispatched focus/online events, not the config value |
| 7 | MEDIUM | `writeBatch` is per-collection; a cascade needs two calls and cannot be atomic across both | Explicit two-call ordering in design |
| 8 | LOW | `@tanstack/react-db` is pre-1.0 (0.3.1) | Carried-over stack risk; `infrastructure/` is the only rewrite surface |

## Delivery Plan

Four chained PRs, `stacked-to-main`, each targeting the previous. Review budget 800 lines.

| PR | Slice | Est. lines | Done when |
|---|---|---|---|
| 1 | 043 repositories | 350-480 | The interface never sees the raw table shape |
| 2 | 044 collections | 250-370 | Collections load and optimistic mutations revert when the server rejects |
| 3 | 045 realtime | 300-420 | A change made on another device appears without reloading |
| 4 | 046 refetch | 80-150 | Returning to the app after losing connection shows up-to-date data |

Total 950-1400 lines. Chained PRs recommended: Yes. 400-line budget risk: High. Decision needed before
apply: Yes — already resolved as `auto-chain` / `stacked-to-main`.

```
PR1 (043) ──▶ PR2 (044) ──▶ PR3 (045) ──▶ PR4 (046)
```

## Rollback

Per slice: revert that PR's branch. No schema, migration, or persisted-data change is involved, and no UI
consumes this layer yet, so a revert of any slice strands only the slices above it. Reverting PR 1 removes
the whole layer and returns the app to its current state.

## Dependencies

- Tasks 032, 033, 035 (folder skeleton, InsForge client, Query/DB providers) — already complete.
- Task 023 remains blocked on a live client; research closed its documentation-reachable part.
- Task 047 (`useHogar`) is the undeclared downstream requirement for 045 to do anything at runtime.

## Success Criteria

- [ ] No raw row shape (`name`, `is_bought`, `list_id`, …) escapes `infrastructure/`.
- [ ] Delete calls carry no soft-delete filter, asserted by a regression test.
- [ ] Collections load, and a rejected mutation reverts the optimistic state.
- [ ] A `list.delete` followed by `item.delete` on already-removed keys neither throws nor discards the
      batch's surviving operations.
- [ ] No realtime event ever triggers a query invalidation.
- [ ] Focus and reconnect force a refetch despite the high `staleTime`, verified by dispatched events.
- [ ] `realtime.ts` imports neither `shared/hogar` nor anything outside `domain/` and `shared/api`.
- [ ] `cd frontend && pnpm test` and `pnpm exec tsc --noEmit` pass for each slice independently.

## References

- Tasks: `docs/tareas/043-repositorios.md`, `044-colecciones.md`, `045-realtime-direct-writes.md`, `046-reconexion.md`
- Exploration: `openspec/changes/infraestructura-datos-realtime/exploration.md`
- Research: `openspec/changes/infraestructura-datos-realtime/research.md`
- Architecture: `docs/03-Arquitectura.md` §3.2, §6, §7
- Backend: `backend/migrations/008_realtime.sql` (task 019, cascade ordering verified 2026-08-20)
