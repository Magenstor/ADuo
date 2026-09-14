# Exploration: Realtime data infrastructure (tasks 043-046)

**Change**: `infraestructura-datos-realtime`
**Slice**: repositories (043) → TanStack DB collections (044) → realtime direct-write translator (045) → reconnect/focus refetch (046)
**Date**: 2026-09-12

## Current state per task

### 043 — Repositories (pending, nothing written)

`frontend/src/modules/listas/infrastructure/` does not exist yet. The domain layer is final and stable:

- `domain/lista.ts` exports `Lista { id, householdId, nombre, createdAt, createdBy, updatedAt, updatedBy }`, `ErrorNombreLista`, `ResultadoCrearLista`, `crearLista()`.
- `domain/articulo.ts` exports `Articulo { id, listaId, householdId, contenido, comprado, boughtAt, boughtBy, createdAt, createdBy, updatedAt, updatedBy }`, `marcarArticuloComprado`, `desmarcarArticuloComprado`, `ordenarArticulosPorIncorporacion`.
- `domain/busqueda.ts` exports normalization helpers, unrelated to this slice.

Backend rows map 1:1 onto these domain shapes — no joins, no derived fields, no aggregation.

### 044 — Collections (pending)

`frontend/src/app/providers/query.tsx` deliberately left `staleTime` at library defaults, with a comment explicitly deferring to task 044 by number.

Verified from the installed `@tanstack/query-db-collection@1.2.6` (`dist/esm/query.d.ts`), `queryCollectionOptions` accepts `queryKey`, `queryFn`, `queryClient`, `getKey`, `staleTime`, `onInsert`/`onUpdate`/`onDelete`, and — importantly — `refetchOnWindowFocus` / `refetchOnReconnect` as pass-through TanStack Query observer options.

**Consequence: task 046 is a configuration flag on task 044's own options object, not separate plumbing.**

`collection.utils` exposes `writeInsert`, `writeUpdate`, `writeDelete`, `writeUpsert`, `writeBatch(callback)` and `refetch`. `writeBatch` is scoped to **one collection instance**; it is not a cross-collection atomic primitive.

### 045 — Realtime translator (pending; upstream task 023 still blocked)

Server side is verified (`backend/migrations/008_realtime.sql`, task 019, 2026-08-20):

- Channel: `household:<uuid>`
- Events: `list.insert` / `list.update` / `list.delete`, `item.insert` / `item.update` / `item.delete`
- Payload: the whole row as `jsonb`, via `realtime.publish(channel, event, to_jsonb(row))`

Task 023's open question — the client-side envelope — is now substantially answered from the exact installed SDK types (`@insforge/sdk@1.5.2` re-exporting `@insforge/shared-schemas@1.2.1`, `dist/realtime.schema.d.ts`):

- `socketMessageSchema` is `{ meta: SocketMessageMeta } & passthrough`. What `insforge.realtime.on(eventName, cb)` delivers is `{ meta, ...row fields spread at top level }` — **not** nested under a `payload` key.
- `SocketMessageMeta = { channel?: string, messageId: string, senderType: 'system' | 'user', senderId?: string, timestamp: string }`.
- The `payload`-nested shape is `webhookMessageSchema`, a different transport used only for webhook delivery — not the Socket.IO `.on()` path this task uses.

### 046 — Reconnect/refetch (pending, small)

Lands in the same collection-options file as 044.

**Real risk**: TanStack Query's default `refetchOnWindowFocus: true` only refetches when the query is already stale. With task 044's deliberately HIGH `staleTime`, `true` can silently no-op inside the stale window — defeating the entire point of task 046. `'always'` forces the refetch regardless of staleness.

## Verified constraint: `writeDelete` on an absent key throws

Confirmed by reading the installed source, `@tanstack/query-db-collection@1.2.6` `src/manual-sync.ts`:

- `validateOperations` (lines 107-136) throws `DeleteOperationItemNotFoundError` when a `delete` operation's key is absent from `syncedData`, `UpdateOperationItemNotFoundError` for the same case on `update`, and `DuplicateKeyInBatchError` for two operations on one key inside a single batch.
- `performWriteOperations` (lines 139-151) runs that validation over the **whole normalized batch before `ctx.begin()`** and before any write is applied.

**This is stricter than task 045's own warning.** The task doc describes the symptom as a console full of errors; the actual behavior is that a single absent key inside a `writeBatch` **aborts the entire batch** — every other operation in it is discarded. On a household with concurrent activity, a cascade delete can therefore drop legitimate writes, not just produce noise.

**Design consequence**: the translator must filter operations against collection membership *before* emitting the batch. A `try`/`catch` around the batch is not sufficient, because the throw discards the surviving operations too.

**Subtlety**: `validateOperations` checks `collection._state.syncedData`, whereas the public `collection.has(key)` (`@tanstack/db@0.8.1`, `src/collection/index.ts:541`) checks `_state.has(key)` — the combined view including optimistic state. A guard written with `has()` can pass while `syncedData` still lacks the key (for example, an optimistically inserted row not yet confirmed). The guard must be validated against that case rather than assumed equivalent.

## Genuinely unverified (needs a live connected client)

- Whether `senderType` is `'system'` for our `SECURITY DEFINER` trigger-originated events.
- Whether extra top-level keys beyond the row's own columns appear (`socketMessageSchema` is `.passthrough()`, so the type cannot rule this out).
- End-to-end JSON null handling for the nullable `bought_by` / `bought_at` columns.

**Mitigation**: put the translator behind one narrow parse/adapter function (for example `filaDesdeMensaje(mensaje: SocketMessage): FilaLista | FilaArticulo`) so a live-client surprise is a one-function fix rather than a rewrite.

## Household id gap

No code in `frontend/src/shared/hogar/` resolves a household id today; that module covers authentication only (`Usuario`, `useSesion`). Task 047 (`useHogar`) is the only future source, and it blocks 048 — **not** 045 or 046.

Per `docs/03-Arquitectura.md` §3.2, `infrastructure/` may import only `domain/` and `shared/api`, never `shared/hogar`. Therefore `realtime.ts` cannot resolve the household id itself and must receive it as a parameter (for example `iniciarSuscripcionHogar(householdId, colecciones)`, called later by the application layer in 047/048).

This is an undeclared coupling: **task 045 is functionally inert until 047 exists**, even though the task graph does not say so.

## Row → domain mapping (verified against the applied SQL)

`shopping_lists` → `Lista`:

| Column | Domain field |
|---|---|
| `id` | `id` |
| `household_id` | `householdId` |
| `name` | `nombre` |
| `created_at` | `createdAt` |
| `created_by` | `createdBy` |
| `updated_at` | `updatedAt` |
| `updated_by` | `updatedBy` |

`shopping_items` → `Articulo`:

| Column | Domain field |
|---|---|
| `id` | `id` |
| `list_id` | `listaId` |
| `household_id` | `householdId` |
| `content` | `contenido` |
| `is_bought` | `comprado` |
| `bought_by` | `boughtBy` |
| `bought_at` | `boughtAt` |
| `created_at` | `createdAt` |
| `created_by` | `createdBy` |
| `updated_at` | `updatedAt` |
| `updated_by` | `updatedBy` |

Pure renames in both directions. The schema enforces hard delete (no `deleted_at`) and a `comprado_coherente` CHECK tying `is_bought` / `bought_at` / `bought_by` together — the mapper must preserve that tri-state exactly.

## Recommended file layout

Follows the worked example in `docs/03-Arquitectura.md` §7 for repositories and realtime, extended for collections:

```
modules/listas/infrastructure/
  listasRepository.ts      (043) CRUD + row→domain mapping for shopping_lists
  articulosRepository.ts   (043) CRUD + row→domain mapping for shopping_items
  listasCollection.ts      (044) queryCollectionOptions, staleTime, onInsert/onUpdate/onDelete → listasRepository
  articulosCollection.ts   (044) same for items → articulosRepository
  realtime.ts              (045 + 046) one module: connect, subscribe, translate, writeBatch, error handler
```

One `realtime.ts` rather than per-entity modules: exactly one channel per household carries both `list.*` and `item.*` events, so a single `subscribe()` dispatching by event name avoids ambiguous double-subscription semantics.

## Forks requiring an explicit decision

1. **Single shared `realtime.ts` vs. per-entity realtime modules.** Recommended: single module, matching the one-channel reality. Cost: one file knows about two collections. Effort: low.
2. **Refetch flag values: `true` vs `'always'`.** Recommended: `'always'` for both flags, because a high `staleTime` silently suppresses the default. Effort: low, but easy to get wrong invisibly.
3. **Where the realtime subscription lifecycle is owned** (provider vs. hook vs. module singleton). Out of scope for 043-046 — an application-layer decision for 047/048. The constraint this slice must honor is that 045's exported surface takes `householdId` as a parameter so any of the three options remains open.

## Testability under strict TDD (Vitest 4 + jsdom, no E2E runner)

- **Row ↔ domain mapping**: pure, zero mocks, exhaustive coverage including the `comprado` / `boughtAt` / `boughtBy` tri-state that mirrors the DB CHECK constraint. `docs/03-Arquitectura.md` §6 exempts `infrastructure/` from unit testing at the network edge, not for embedded pure functions.
- **Repository CRUD**: mock `@/shared/api/insforge` with `vi.hoisted` + `vi.mock`, the established pattern from `use-sesion.test.ts` and `query.test.tsx`. Include a regression test asserting delete calls carry no soft-delete filter.
- **Collections**: testable end-to-end through `@tanstack/db`'s in-memory `Collection` (no network, no jsdom) with the repository mocked. Verify `onInsert` / `onUpdate` / `onDelete` reach the right repository function, and that a rejected mutation reverts the optimistic state.
- **Realtime translator**: mock `insforge.realtime` as an in-memory emitter; feed hand-built `SocketMessage`-shaped fixtures for all six event names; assert the correct write calls. Include an explicit regression test reproducing task 019's cascade ordering — `list.delete` followed by `item.delete` on already-removed keys must neither throw nor discard the batch's surviving operations.
- **Focus/reconnect refetch**: testable in jsdom via `QueryClientProvider` + `renderHook` + dispatched `window` focus/online events against a spy `queryFn`, reusing the `query.test.tsx` harness. Prefer a real integration test over asserting the config value.
- Only a real WebSocket round-trip against live InsForge is out of reach — exactly the gap task 023 already defers to manual verification.

## Risks (ranked)

| # | Severity | Risk |
|---|---|---|
| 1 | HIGH | `writeDelete` / `writeUpdate` on an absent key throws and aborts the whole batch. **Confirmed from source**, stricter than task 045's own warning. Requires a membership filter before emitting the batch. |
| 2 | HIGH | `meta` envelope typed from the shipped SDK schema but not verified against a live connected client (task 023 still blocked). Mitigate with one narrow adapter function. |
| 3 | HIGH | Household id sourcing gap: 045 needs an id no current frontend code produces; it must be injected as a parameter. |
| 4 | MEDIUM | `staleTime` + refetch-flag interaction: default `true` may not force a refetch within a long stale window; likely needs `'always'`. |
| 5 | MEDIUM | `writeBatch` is per-collection; a list + item cascade needs two separate batch calls. |
| 6 | LOW | `@tanstack/react-db` is still pre-1.0 (0.3.1) — a carried-over risk from the original stack decision. |

## Review workload forecast

Given this repository's near 1:1 implementation-to-test ratio:

| Task | Estimated changed lines |
|---|---|
| 043 | 350-480 |
| 044 | 250-370 |
| 045 | 300-420 |
| 046 | 80-150 |
| **Total** | **950-1400** |

- **Chained PRs recommended**: Yes
- **400-line budget risk**: High (three of four slices exceed 400 lines individually)
- **Decision needed before apply**: Yes

Each task already has a clean start and finish per its own "Hecho cuando" criterion, so the four task boundaries are the natural slice boundaries.

## Ready for proposal

Yes. The fork points — household-id parameter injection, refetch flag values, single shared realtime module, and the batch-membership guard — are named decisions for `sdd-propose` and `sdd-design`, not blockers.
