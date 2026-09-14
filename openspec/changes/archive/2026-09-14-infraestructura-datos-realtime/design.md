# Design: Realtime data infrastructure for shared shopping lists

## Technical Approach

Five modules in `frontend/src/modules/listas/infrastructure/`. TanStack Query performs the initial
load through `queryCollectionOptions`; the InsForge WebSocket applies every subsequent change as a
direct write. Both collections and the realtime module are **factories taking their context as
parameters** — never module singletons — because `infrastructure/` may not import `shared/hogar`
(§3.2) and nothing outside `app/` may import `app/` (§2).

## Architecture Decisions

### D1 — `insert` and `update` events both map to `writeUpsert`

**Choice**: the translator never calls `writeInsert` or `writeUpdate`.

Verified in `@tanstack/query-db-collection@1.2.6` `src/manual-sync.ts`: `validateOperations`
(lines 126-134) checks membership for `update` and `delete` only — `upsert` is never validated. The
`upsert` branch (lines 193-211) reads `syncedData.has(op.key)` itself and emits `update` or `insert`
accordingly. It cannot throw on a missing or a present key.

A second, previously unrecorded hazard makes this decisive: `@tanstack/db@0.8.1` `src/collection/sync.ts:154-184`
throws `DuplicateKeySyncError` when a plain `insert` targets a key already in `syncedData`, unless the
value **deep-equals** the stored one (lines 166-174). A server echo of our own optimistic insert will
not deep-equal, because `updated_at` / `updated_by` are set server-side by migration 005. That throw
happens inside `ctx.write()`, i.e. **after** `ctx.begin()` (`manual-sync.ts:154`) — a mid-transaction
failure, worse than the pre-validation one.

**Rationale**: choosing `writeUpsert` removes `UpdateOperationItemNotFoundError`, `DuplicateKeySyncError`
and every echo/ordering concern structurally, with zero guard code. Only `delete` is left to defend.

### D2 — membership guard for `delete`: the publicly-typed `_state.syncedData`

**The question the proposal deferred, resolved.**

| Candidate | State it reads | Verdict |
|---|---|---|
| `collection.has(key)` | `index.ts:542` → `state.ts:380-392`: consults `optimisticDeletes` / `optimisticUpserts` **first** | Wrong state. Diverges exactly as the proposal predicted. |
| `collection.utils.*` | `query.ts:263-273`: `refetch`, `writeInsert/Update/Delete/Upsert/Batch` only | No membership read exists. |
| any `getSyncedItem`-style accessor | absent from `dist/esm/collection/index.d.ts` | Does not exist. |
| `collection._state.syncedData.has(key)` | the exact map `validateOperations` checks | **Chosen.** |

**There is no documented API that avoids the internal.** But the internal is not a private field:
`src/collection/index.ts:302-304` reads `// The core state of the collection is "public" so that is
accessible in tests and for debugging` above `public _state: CollectionStateManager<...>`, and it ships
in `dist/esm/collection/index.d.ts:134`. `syncedData` is `public syncedData: SortedMap<TKey, TOutput>`
(`src/collection/state.ts:77`, shipped at `dist/esm/collection/state.d.ts:46`). So
`coleccion._state.syncedData.has(clave)` typechecks under `tsc --noEmit` with no cast and no
`@ts-expect-error`.

It is publicly *typed*, not publicly *contracted* — the author's comment scopes the intent to tests and
debugging, so it is semver-fragile.

**Mitigation**: confine it to one named predicate in `realtime.ts`:

```ts
function estaSincronizado<T extends object>(coleccion: Collection<T, string>, clave: string): boolean
```

A test pins the divergence itself: optimistically insert a key, then assert
`coleccion.has(clave) === true` while `estaSincronizado(coleccion, clave) === false`. If a future
version moves `syncedData`, one function changes and one test fails loudly.

**Rejected alternatives**

| Option | Tradeoff | Why rejected |
|---|---|---|
| Catch `DeleteOperationItemNotFoundError` per operation (it is a public export — `src/index.ts:12` re-exports all of `errors.ts`) | 100% public API | Needs one sync transaction per key; on a cascade that is N re-renders. Kept as the **fallback if D2's internal ever breaks** — the escape hatch is real. |
| `try`/`catch` around the batch | trivial | The throw discards the surviving operations too. Rejected in the proposal, confirmed at `manual-sync.ts:150`. |
| Split the batch on failure and replay per operation | preserves survivors | Only reachable if the guard is wrong; D3 makes batches unable to fail. Dead code. |

**Never swallows real errors**: the guard filters, it does not catch. Any exception reaching the
`.on()` handler is reported through `alReportar` (D7) and re-surfaced, never discarded.

### D3 — batch granularity: one write per message; `writeBatch` only for the cascade

Each socket message carries exactly one row (`008_realtime.sql:26-28`, `to_jsonb(OLD|NEW)`), so a
per-message batch would be degenerate. One direct write per message makes `DuplicateKeyInBatchError`
(`manual-sync.ts:118`) **structurally unreachable** and confines any failure to one row.

`writeBatch` is used in exactly one place: the client-side cascade on `list.delete`, where one message
produces N deletes on `articulosCollection`. There the keys are read out of `syncedData` itself, so they
are unique by construction and every one is provably present — that batch cannot throw.

### D4 — cascade ordering: children first, then the parent

`list.delete` arrives **before** the server's `item.delete` events (task 019, verified 2026-08-20;
mechanism is the `AFTER ... FOR EACH ROW` trigger in `008_realtime.sql:44-50` firing after the FK
cascade queues). The translator does not wait for them.

```
list.delete(listaId)
  │
  ├─1  articulosCollection.utils.writeBatch(() => claves.forEach(writeDelete))
  │      claves = syncedData.values().filter(a => a.listaId === listaId).map(a => a.id)
  │
  └─2  listasCollection.utils.writeDelete(listaId)      guarded by estaSincronizado
```

`writeBatch` is per-collection (`manual-sync.ts:314-360`, keyed by `SyncContext`), so this is two calls
and cannot be atomic. **If step 2 fails after step 1 committed**, the residue is an empty `Lista` still
visible. That is a legal, renderable state, and task 046's reconnect/focus refetch repairs it. The
reverse order would leave `Articulo` rows whose `listaId` no future event mentions — unreachable garbage
nothing ever cleans up. That asymmetry is the whole reason for the order.

The server's later `item.delete` events for those same rows hit `estaSincronizado` and become no-ops.
Idempotence is the point, not an accident.

### D5 — collections and realtime are factories, not singletons

`queryCollectionOptions` requires a `QueryClient` (`errors.ts:25` `QueryClientRequiredError`), and the
only instance lives in `app/providers/query.tsx` — which `infrastructure/` may not import (§2: nothing
outside `app/` imports `app/`). Therefore:

```ts
crearListasCollection(queryClient: QueryClient, householdId: string): Collection<Lista, string>
crearArticulosCollection(queryClient: QueryClient, householdId: string): Collection<Articulo, string>
```

`application/` (047/048) supplies the client via `useQueryClient()` — no `app/` import anywhere. Bonus:
a fresh `QueryClient` per Vitest test, no shared-cache bleed.

One `articulos` collection per **household**, not per list (`queryKey: ['articulos', householdId]`),
because the channel is per household. `application/` filters by `listaId`. Tradeoff: loads every article
of the household up front — acceptable for a two-person MVP, revisit if a household ever holds thousands.

### D6 — collection options (044 + 046)

| Option | Value | Why |
|---|---|---|
| `staleTime` | `Infinity` | The socket is the update channel. `staleTime` now governs mount/remount only, since `'always'` bypasses it. |
| `refetchOnWindowFocus` | `'always'` | `true` refetches only when already stale; `Infinity` means never stale, making `true` a silent no-op. Pass-through confirmed at `query.ts:60-61, 682-683, 1353-1354`. |
| `refetchOnReconnect` | `'always'` | Same reason. A dropped socket does not replay what was missed. |
| `getKey` | `(x) => x.id` | `uuid` PK. |
| `onInsert`/`onUpdate`/`onDelete` | repository calls | Rejection reverts the optimistic state. |

### D7 — the realtime `error` handler

It **logs and reports; it never throws, never invalidates, never refetches.**

- No `queryClient.invalidateQueries`: that is the per-row full-table refetch this layer exists to avoid.
- No retry: `socket.io-client` (an `@insforge/sdk` dependency) owns reconnection; `refetchOnReconnect: 'always'` owns the data repair.
- Surfaces through an injected `alReportar?: (fallo: FalloRealtime) => void` so `infrastructure/` never imports UI. Default `console.error`.
- `FalloRealtime` discriminates `'socket'` | `'mensaje-ilegible'` | `'evento-desconocido'`.

## Interfaces / Contracts

```ts
// listasRepository.ts (043) — also the home of the mapping functions
export type FilaLista = {
  id: string; household_id: string; name: string
  created_at: string; created_by: string; updated_at: string; updated_by: string
}
export function listaDesdeFila(fila: FilaLista): Lista
export function filaDesdeLista(lista: Lista): Pick<FilaLista, 'id' | 'household_id' | 'name'>
export function obtenerListas(householdId: string): Promise<Lista[]>
export function insertarLista(lista: Lista): Promise<Lista>
export function actualizarLista(lista: Lista): Promise<Lista>
export function eliminarLista(id: string): Promise<void>   // no soft-delete filter, ever

// articulosRepository.ts (043)
export type FilaArticulo = { /* id, list_id, household_id, content, is_bought,
                                bought_by, bought_at, created_*, updated_* */ }
export function articuloDesdeFila(fila: FilaArticulo): Articulo
export function filaDesdeArticulo(articulo: Articulo): Partial<FilaArticulo>
export function obtenerArticulos(householdId: string): Promise<Articulo[]>
export function insertarArticulo(a: Articulo): Promise<Articulo>
export function actualizarArticulo(a: Articulo): Promise<Articulo>
export function eliminarArticulo(id: string): Promise<void>

// realtime.ts (045)
export type ColeccionesRealtime = {
  listas: Collection<Lista, string>
  articulos: Collection<Articulo, string>
}
export type FalloRealtime =
  | { tipo: 'socket'; causa: unknown }
  | { tipo: 'mensaje-ilegible'; evento: string; causa: string }
  | { tipo: 'evento-desconocido'; evento: string }
export type SuscripcionHogar = { detener: () => void }

export function iniciarSuscripcionHogar(
  householdId: string,
  colecciones: ColeccionesRealtime,
  alReportar?: (fallo: FalloRealtime) => void,
): Promise<SuscripcionHogar>

export function filaDesdeMensaje(mensaje: SocketMessage): Record<string, unknown>
```

### `filaDesdeMensaje` — the adapter boundary

Absorbs all three research findings:

1. **`meta.senderId` may be `undefined` or `null`** → never read, never branched on. `meta.senderType !== 'system'` drops the message (one line of defense-in-depth; `008_realtime.sql:69-72` grants no INSERT policy on `realtime.messages` to anyone, so the false path should be unreachable — the check exists so an RLS regression is visible instead of silent).
2. **Flat envelope** → `const { meta, ...fila } = mensaje`. No `payload` / `new` wrapper is looked for (research Q2; the contradicting dev.to example is treated as unverified inference).
3. **Literal `meta` column guard** → before destructuring, assert the envelope shape: `typeof meta === 'object' && meta !== null && typeof meta.messageId === 'string'`. A future migration adding a `meta` column would otherwise silently shadow the envelope. Failure reports `'mensaje-ilegible'` and drops the message — loudly, not silently.
4. **Null vs missing** → normalized in the *mapper*, not the adapter: `articuloDesdeFila` uses `fila.bought_by ?? null`. `??` makes an absent key and an explicit `null` identical. **Never** `'bought_by' in fila`.

### Subscription lifecycle

`connect()` → `subscribe('household:' + householdId)` → six `.on(evento, ...)` registrations → `error`
handler. `detener()` removes the six handlers and unsubscribes the channel; it does **not** `disconnect()`
the shared client, which 047/048 may own. `detener()` is idempotent. No React import, so a provider, a
hook, or a module singleton all remain viable in 047/048 — that choice is deliberately not made here.

**Honest consequence (carried from the proposal)**: no code produces a `householdId` today, so
**task 045 is inert until task 047 exists**, even though the task graph declares no such edge.

## Data Flow

```
   mount ──▶ queryFn ──▶ obtenerListas(householdId) ──▶ PostgREST ──▶ listaDesdeFila ──▶ syncedData
                                                                                            ▲
 InsForge WS ──▶ .on('list.update') ──▶ filaDesdeMensaje ──▶ listaDesdeFila ──▶ writeUpsert ─┘
                 .on('list.delete') ──▶ estaSincronizado? ──▶ articulos batch ──▶ lista delete
 focus / online ──▶ refetchOn*: 'always' ──▶ queryFn (repairs anything the socket missed)
```

Mutations flow the other way: UI → `application/` → `collection.insert/update/delete` (optimistic) →
`onInsert`/`onUpdate`/`onDelete` → repository → PostgREST → trigger → the event returns and upserts
idempotently.

## Architecture-Boundary Compliance (§3.2)

| Module | Imports | Allowed by |
|---|---|---|
| `listasRepository.ts` | `@/shared/api/insforge`, `../domain/lista` | §3.2 `shared/api` + `domain/` |
| `articulosRepository.ts` | `@/shared/api/insforge`, `../domain/articulo` | idem |
| `listasCollection.ts` | `@tanstack/query-db-collection`, `./listasRepository`, `../domain/lista` | vendor + intra-layer + `domain/` |
| `articulosCollection.ts` | idem for articulos | idem |
| `realtime.ts` | `@/shared/api/insforge`, `./listasRepository`, `./articulosRepository`, `../domain/*` (types), `@tanstack/db` (type `Collection`) | §3.2 |

Forbidden and **absent everywhere**: `@/shared/hogar` (hence the `householdId` parameter),
`@/app/**` (hence the `queryClient` parameter), `@/modules/*/application`, `@/modules/*/ui`,
any other module. No barrel files (§8). `QueryClient` appears only as a parameter type from
`@tanstack/query-core`, never as an `app/` import.

## Testing Strategy

Strict TDD, RED first. Vitest 4 + jsdom. No E2E runner. Established pattern: `vi.hoisted` + `vi.mock`
of **our own** `@/shared/api/insforge` boundary (never the vendor package), per the template comment in
`shared/hogar/use-sesion.test.ts:7-22`.

| Slice | Faked at | What is proven |
|---|---|---|
| 043 mappers | nothing — pure | Both directions exhaustively, including the `comprado` / `boughtAt` / `boughtBy` tri-state that mirrors the `comprado_coherente` CHECK. |
| 043 CRUD | `vi.mock('@/shared/api/insforge')` → fake `database.from()` chain | Correct table, columns, and filters. **Regression: `eliminarLista`/`eliminarArticulo` issue no `deleted_at` filter.** Errors surface, not swallowed. |
| 044 collections | repository module mocked; real in-memory `@tanstack/db` `Collection`; fresh `QueryClient` | `onInsert`/`onUpdate`/`onDelete` reach the right repository function; a rejected mutation reverts the optimistic state; `getKey` derives `id`. |
| 044/D2 guard | real collection, no network | **The divergence test**: after an optimistic insert, `has() === true` and `estaSincronizado() === false`. |
| 045 translator | `insforge.realtime` as an in-memory emitter; hand-built `SocketMessage` fixtures for all six events | Each event reaches the right write. **Cascade regression**: `list.delete` then `item.delete` on already-removed keys neither throws nor discards surviving operations. Ordering: articulos batch commits before the lista delete. `meta`-collision fixture reports `'mensaje-ilegible'`. `senderId: undefined` and `senderId: null` fixtures both process. No `invalidateQueries` call, asserted with a spy. |
| 046 refetch | `QueryClientProvider` + `renderHook` + dispatched `window` `focus`/`online`, spy `queryFn` | A real refetch fires **despite `staleTime: Infinity`**. Asserting the config literal is explicitly not enough — that is what would hide the `true` no-op. |

Out of reach: a real WebSocket round-trip against live InsForge — the same gap task 023 already defers
to manual verification.

## Tradeoffs (`design.require_tradeoffs: true`)

| Decision | Accepted cost |
|---|---|
| `_state.syncedData` guard (D2) | Semver-fragile read of an internal-by-convention field. Bought: correctness against the exact state `validateOperations` checks, and batching. Contained to one predicate + one pinning test; the public-error-catch fallback is documented. |
| `writeUpsert` everywhere (D1) | Loses the ability to detect a genuinely unexpected duplicate insert. Bought: two of three error classes eliminated structurally. |
| One write per message (D3) | More sync transactions than a coalesced drain. Bought: `DuplicateKeyInBatchError` unreachable; one bad row cannot discard others. |
| Client-side cascade (D4) | The translator knows about two collections. Bought: no orphan-`Articulo` flicker between `list.delete` and the last `item.delete`. |
| Factory collections (D5) | Callers must thread `queryClient` and `householdId`. Bought: §2/§3.2 compliance and per-test isolation. |
| Household-wide `articulos` collection (D5) | Loads every article up front. Bought: one collection, one channel, one subscription. |
| `staleTime: Infinity` (D6) | A dropped event with no socket error persists until focus or reconnect. Bought: no refetch ever lands on top of a direct write and resurrects a deleted item. |
| Four stacked PRs | `main` temporarily holds repositories without collections. Bought: each slice under the 800-line budget. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or
process-integration boundary. This change is a browser-side data adapter.

## Migration / Rollout

No migration. No schema change. No persisted-data change. Four stacked PRs on the 043/044/045/046
boundaries; revert any slice to strand only the slices above it.

## Open Questions

- [ ] **UNRESOLVED (research Q3)**: end-to-end JSON null handling for `bought_by` / `bought_at` on the
      live wire. **How the design absorbs it**: `??` in `articuloDesdeFila` makes absent and explicit
      `null` identical, so both documented outcomes map to the same `Articulo`. Only a live client
      closes it definitively; a surprise is a one-function fix.
- [x] ~~**Installed-tree anomaly**: `@insforge/sdk@1.5.2` appears to have no `dist/`.~~ **RETRACTED —
      verified false.** `node_modules/.pnpm/@insforge+sdk@1.5.2/node_modules/@insforge/sdk/dist/`
      contains 24 files, including `index.js`, `index.mjs` and `index.d.ts`, exactly as
      `package.json`'s `main` / `module` / `types` / `exports` fields point. No `pnpm install` repair is
      needed and `SocketMessage` can be imported normally rather than declared locally.
- [ ] Whether `senderType !== 'system'` should drop or merely report. Chosen: drop and report. Revisit
      only if a live client shows legitimate non-system traffic on the household channel.
