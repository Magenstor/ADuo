# Design: Household and Shopping Application Hooks

## Materialization Context

Materialized from approved Engram observation #519, retained at `sdd/hooks-aplicacion-listas/design`. Technical decisions below are unchanged. The original Engram-only/no-repository-writes instruction and unresolved size gate describe the approval phase, not this materialization. Current explicit preflight: auto execution, both stores, `exception-ok`, 600 authored changed-line review budget, user-accepted size exception, chain strategy deferred. This supersedes older delivery defaults without changing the 650–850-line forecast. No redesign or implementation is performed.

## Technical Approach
Implement proposal #517 and spec #518 using research #516. Scope is ADuo `frontend`, not `packages/coding-agent`. Preserve repositories, collection factories, and realtime translation.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| Shared household provider imports shopping infrastructure | Violates architecture §4.3 | Reject; inject a module-owned resource boundary through a component prop, composed in AppProviders. |
| Separate per-hook collections | Duplicates subscriptions | Reject; one injected boundary owns stable collections and one subscription per resolved scope. |
| Directly delete children optimistically | Requires unsafe snapshot restoration over server events | Reject; article live queries join visible parent lists. Parent optimistic deletion removes the entire derived subtree in memory; rollback restores visibility without child writes. |
| Promise-returning transaction handles | Leaks storage contract | Reject; await `isPersisted.promise`, return typed outcomes, retain library rollback. |
| Batch clear-bought transaction | Existing handlers persist only mutation zero | Reject; one delete transaction per article, aggregate ordered outcomes with allSettled. |
| Render-time resource construction | Strict Mode can discard live resources | Create/preload in effect; publish stable instances only after setup; cleanup each generation. |

`HogarProvider` in shared owns resolution and mounts its injected resource boundary only for resolved membership. The module boundary owns shopping resources and reports lifecycle errors upward; shared never imports module types. Keep resolved household internally when realtime fails, but public useHogar becomes error and shopping projections become empty/non-ready. Do not automatically restart on error.

## Data Flow
Session → membership query → household/member parallel reads → household scope → injected shopping boundary → collection preload/realtime → live projections → public hooks.

Read `household_members` filtered by user_id with limit 2; zero yields sin-hogar, two yields configuration error. Read household by ID and all its members using explicit columns and complete pagination. Map to Hogar {id,nombre}, Miembro {id,householdId,userId,nombre}. Check every SDK error; missing household is error. Signed-out maps to loading/non-ready, not sin-hogar. Key resolution by session identity; generation guards reject late reads and mutation callbacks. Mask mismatched scope synchronously before effects run.

Realtime currently connects before handlers, ignores subscribe results, and lacks channel guards. Preserve its async API, add optional AbortSignal, register handlers first, check subscribe.ok, filter meta.channel, handle connect_error, and make disposal idempotent. Serialize provider setup/teardown so a late same-channel unsubscribe cannot cancel the next generation. Stop listeners/subscription before collection cleanup; do not disconnect the shared SDK socket globally. Cancel/remove only old household query keys after teardown to prevent reused stale caches.

## Interfaces / Contracts
- `useHogar`: discriminated estado loading | ready(hogar,miembros) | sin-hogar | error(error).
- Shopping hooks: arrays, loading, ready, error, documented actions; unavailable resources expose empty arrays and rejecting validation outcomes.
- Single actions return Promise<Resultado<T>>: `{ok:true,valor:T}` or `{ok:false,error:ErrorAplicacion}`. Error carries tipo validation | persistence | query | realtime and causa. Create/add return ID; others void. Hook error resets on scope change/new attempt; late old-scope failures cannot overwrite it.
- `crear(nombre)`, `renombrar(id,nombre)`, `eliminar(id)`; article actions accept content or scoped article ID; `limpiarComprados()` returns successfulIds/failedIds in selected order and per-ID errors.
- Validate trimmed content, list names through crearLista (80 Unicode characters), current parent/record scope before mutation. Reuse mark/unmark domain helpers; client UUID/time/user audit fields are provisional. Reject stale retained callbacks.
- Articles use existing pending-first/incorporation comparator, with ID preordering for timestamp ties. Lists lack an existing comparator: define createdAt then ID ordering. No self-echo deduplication.

## File Changes
| Paths under frontend/src | Change |
|---|---|
| shared/hogar/hogar-repository.ts, hogar-contexto.tsx | New reads/types/resolution/injected boundary |
| modules/listas/application/hogar-listas.tsx, useListas.ts, useArticulos.ts | New private resources/projections/actions |
| shared/hogar/hogar-repository.test.ts, shared/hogar/hogar-contexto.test.tsx | New behavior tests |
| modules/listas/application/hogar-listas.test.tsx, modules/listas/application/useListas.test.tsx, modules/listas/application/useArticulos.test.tsx | New behavior tests |
| modules/listas/infrastructure/realtime.ts and realtime.test.ts | Lifecycle hardening |
| modules/listas/index.ts; app/providers/query.tsx | Public exports/composition only |

Grouped filenames inherit their row's directory; the five corresponding test paths are expanded from #519.

## Testing Strategy
Strict RED→GREEN→refactor with `cd frontend && pnpm test` at each stage. Use real collections, mocked repositories, deferred promises, renderHook/StrictMode. Cover cardinality/read errors; pending setup cancellation/channel isolation; session cache isolation; all action validation/success/rollback; parent-child visibility without child persistence; mixed/empty clear-bought; ordering/server echoes. No tests executed during design or materialization.

## Threat Matrix
N/A — no routing, shell, subprocess, VCS automation, executable classification, or process integration changes. RLS remains authoritative.

## Migration / Rollout
No migration, dependencies, UI, or route changes. Revert new boundary/hooks and narrow wiring; persisted mutations remain authoritative.

## Open Questions / Gates
Forecast 650–850 authored additions+deletions including tests: high risk against explicit 600-line single-PR cap. Tasks must refine forecast without silently reducing coverage. The original approval required pausing before apply if over budget without implicitly choosing chaining/exception; the current user explicitly accepted the size exception (`exception-ok`), with chaining deferred.

Original design tooling lacked execution/CodeGraph; targeted source reads substituted. Both injected skills loaded; phase skill required fallback-path. Refresh official SDK docs before integration edits.
