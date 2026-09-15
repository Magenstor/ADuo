# Exploration: ui-listas (Group A — tasks 049, 052, 055)

**Change**: `ui-listas`
**Source**: materialized from Engram `sdd/ui-listas/explore` (#540, 2026-09-15). The explore phase had no file-write tool; this file mirrors that observation verbatim in structure and content.

## Current State

**Hooks (`frontend/src/modules/listas/index.ts` barrel, `application/useListas.ts`, `application/useArticulos.ts`):**
- `useListas()`: no args. Returns `{ listas: Lista[] (sorted by createdAt then id), loading, ready, error?: ErrorAplicacion, crear(nombre): Promise<Resultado<string>>, renombrar(id, nombre): Promise<Resultado<void>>, eliminar(id): Promise<Resultado<void>> }`. `Lista = { id, householdId, nombre, createdAt, createdBy, updatedAt, updatedBy }`. Mutations are optimistic (TanStack DB collection insert/update/delete) and the promise resolves only after `transaction.isPersisted.promise` settles — `ok:false` on validation (empty/invalid name) or persistence failure, with the list state rolled back automatically. `crear('')`/whitespace-only is rejected as `tipo:'validation'` before touching the collection.
- `useArticulos(listaId: string)`: returns `{ articulos: Articulo[], loading, ready, error?, agregar, editar, marcar, desmarcar, eliminar, limpiarComprados }`. Read-only use here (article count for delete confirmation) — call `useArticulos(listaId).articulos.length`, ignore the mutators. `loading`/`ready` mirror `useListas` semantics; while `!ready` the count should not be presented as final (see Risks).
- Both hooks derive `disponible` from `useHogar()` (`estado === 'ready'` and `householdId` match) and `useSesion()`; when unavailable they return empty arrays and `loading:true`, never throw.
- `ErrorAplicacion` = `Error & { tipo: 'validation'|'persistence'|'query'|'realtime' }`. `Resultado<T> = {ok:true, valor:T} | {ok:false, error:ErrorAplicacion}`.

**`useHogar()` (`frontend/src/shared/hogar/hogar-contexto.tsx`):** returns a discriminated `EstadoHogar`: `{estado:'loading'} | {estado:'ready', hogar:{id,nombre}, miembros:Miembro[]} | {estado:'sin-hogar'} | {estado:'error', error}`. `Miembro = {id, householdId, userId, nombre}`. Read-only consumption is enough for the second-member notice: `hogar.estado === 'ready' && hogar.miembros.length < 2`.

**`useSesion()` (`frontend/src/shared/hogar/sesion-contexto.tsx`):** `{user: Usuario|null, loading, error, signIn, signOut}`. Under `_privado`, `user` is guaranteed non-null once mounted (route guard already redirected).

**Shared UI primitives (`frontend/src/shared/marco/ui/`):**
- `EstadoVacio({titulo, descripcion?, children?})` — renders `<h2>{titulo}</h2>`, optional `<p>{descripcion}</p>`, then `children` as an action slot. Explicitly designed (see its own code comment) so task 049's "no lists yet" case can pass an inline create-list form as `children`. Deliberately has no `role="status"`.
- `EstadoCarga({etiqueta?})` — `<div role="status" aria-live="polite">{etiqueta ?? 'Cargando…'}</div>`.
- `MarcoApp({children})` — the single `<h1>ADuo</h1>` header (brand, plain text) + `NavegacionApp` + `IdentidadUsuario`, then `<main>{children}</main>`. Screens registered under `_privado` must use `<h2>` and below (never a second `<h1>`).

**Routes:** `frontend/src/routes/_privado.tsx` is the pathless auth guard (`Navigate` to `/entrar` if no user, else `<MarcoApp><Outlet/></MarcoApp>`). `frontend/src/routes/_privado/index.tsx` is currently a static placeholder rendering `EstadoVacio` with hardcoded Spanish copy ("Todavía no tienes listas" / "Crea tu primera lista para compartirla con tu hogar.") — this is exactly the file Group A owns and must replace with the real listing.

**Providers (`frontend/src/app/providers/query.tsx`, `app/router.tsx`):** one module-level `QueryClient`, wrapped `QueryClientProvider > SesionProvider > HogarProvider(recurso=HogarListas)`. `HogarListas` (`modules/listas/application/hogar-listas.tsx`) is the resource boundary that creates the `listasCollection`/`articulosCollection` and the realtime subscription per household, exposed via `useRecursosListas()` — internal, `useListas`/`useArticulos` already wrap it; Group A never touches it directly. `router.tsx` builds the router from the generated `routeTree.gen.ts`; `Register.router` type comes from here, which is what makes the typed `Link to="/listas/$listaId"` fail before task 050's route exists (see the confirmed seam below).

**Group boundary + seam (Engram #536, #538):** Group A writes only `frontend/src/routes/_privado/index.tsx` and `frontend/src/modules/listas/ui/listas/**`; may install new shadcn components under `frontend/src/shared/ui/` (never edit existing `button.tsx`/`alert.tsx`/`avatar.tsx`); must not touch `marco-app.tsx`, `navegacion-app.tsx`, `shared/hogar/**`, the hooks, or hand-edit `routeTree.gen.ts`. The `Link` to `/listas/$listaId` must live in one component `frontend/src/modules/listas/ui/listas/enlace-lista.tsx` with a `// @ts-expect-error` on the offending line (removed by whoever merges second, once task 050's route exists).

## shadcn / tooling

- `components.json`: style `radix-maia`, base `mist`, aliases `components`/`ui` → `@/shared/ui`, `utils` → `@/shared/lib/utils`. Only `button.tsx`, `alert.tsx`, `avatar.tsx` exist today under `frontend/src/shared/ui/`. Components were installed with the shadcn CLI pointed at this config (`shadcn add <name>`, per `docs/tareas/030-shadcn.md`) — copies code into the repo, not a dependency; treat any newly generated file as ours to edit like any other component, but per the boundary contract never touch the three pre-existing ones.
- Needed for this scope: an accessible destructive-confirm primitive for delete (no `dialog`/`alert-dialog` installed yet), and a text `input` (+ visible `label`, matching Forms & Feedback priority-8 rule from ui-ux-pro-max: "Placeholder-only label" is an anti-pattern) for create/rename. None of `input`, `label`, `dialog`, `alert-dialog` exist in the repo yet.
- No dedicated `tsc --noEmit` script in `frontend/package.json`, but `openspec/config.yaml` names the exact command: `cd frontend && pnpm exec tsc --noEmit`. Test: `cd frontend && pnpm test` (Vitest 4, jsdom, globals on, setup `frontend/src/test/setup.ts` only registers jest-dom matchers — no global mocks). Lint: `cd frontend && pnpm lint`. Format check: `cd frontend && pnpm check`.
- `frontend/vite.config.ts` test glob: `src/**/*.{test,spec}.{ts,tsx}`, colocated tests.

## Test conventions observed (`useListas.test.tsx`, `marco-app.test.tsx`, `rutas-protegidas.test.tsx`, `estado-vacio.test.tsx`)

- Mock exactly the module-boundary hooks with `vi.hoisted` + `vi.mock('@/shared/hogar/hogar-contexto', () => ({useHogar}))` etc. — never mock deeper (e.g. `useListas.test.tsx` fakes `useHogar`/`useSesion`/`useRecursosListas` only, and exercises the *real* `crearListasCollection` so optimistic mutation/rollback is genuinely tested, not stubbed).
- Route/provider integration tests (`marco-app.test.tsx`, `rutas-protegidas.test.tsx`) mock only `@/shared/api/insforge` (the outermost boundary) plus devtools packages (`@tanstack/react-devtools`, `@tanstack/react-router-devtools` → `null`), then render the *real* `AppProviders` + `RouterProvider` with `getRouter(createMemoryHistory({initialEntries:[ruta]}))`. This is the pattern Group A should reuse for an index-route integration test.
- Queries are role-scoped to landmarks: `findByRole('banner')`, `findByRole('main')`, then `within(banner)`/`within(main)`. Touch-target assertions are structural only (`toMatch(/\bmin-h-11\b/)`), documented as "real verification is visual, at 375px width in `pnpm dev`."
- Identifiers (functions, variables, test descriptions in some files) mix Spanish domain nouns (`lista`, `renombrar`, `eliminar`, `disponible`) with English `it(...)` descriptions and English code comments. Test `it()` strings are English; component internal identifiers are Spanish.

## Product open points and resolution

1. **UI copy language — resolved by evidence, not guesswork.** `docs/00-Vision-y-Modulos.md:44` states "Idioma: español. Sin i18n." as an explicit product decision. The current `_privado/index.tsx` placeholder already follows this ("Todavía no tienes listas"). However `pantalla-acceso.tsx`/`identidad-usuario.tsx` (auth chrome, outside Group A's write boundary) use English button copy ("Sign in with Google", "Sign out") with a code comment "English UI copy for each error code" — a pre-existing inconsistency Group A does not own and must not fix. **Recommendation: all new Group A copy must be in Spanish**, matching both the documented product decision and the existing placeholder it replaces.

2. **Rename: inline vs dialog.** No existing convention pins this (052's task file only requires the capability, not the interaction shape).
   | Approach | Pros | Cons | Effort |
   |---|---|---|---|
   | Inline edit-in-place (edit affordance on the list row swaps the name for a controlled `input`; Enter commits, Escape cancels) | Fewest taps, no extra shadcn component beyond `input`, fits the "usable with one hand, standing" ethos that motivates 057 | Needs local per-row edit state + blur-vs-cancel semantics; discoverability depends on a visible edit icon/button | Low |
   | Dialog-based rename (action opens a small form dialog with `input` + Save/Cancel) | Discoverable, consistent modal pattern shared with delete-confirm, easier full-width validation messaging | Extra shadcn `dialog` install, one more tap before every rename, heavier for a single-field edit | Medium |
   **Recommendation: inline edit-in-place.**

3. **Delete confirmation.** 052 mandates the count of articles that will be lost.
   | Approach | Pros | Cons | Effort |
   |---|---|---|---|
   | shadcn `alert-dialog` (Radix-based, installed via CLI into `shared/ui/`) | Built-in focus trap, ESC-to-close, correct `role="alertdialog"`/labelling — meets ui-ux-pro-max Accessibility priority-1 checks for free | One more component to install within the boundary's "new components" allowance | Low |
   | Hand-rolled confirm built from the existing `Alert` component | No new install | `Alert` is a static `role="alert"` banner, not a modal — no focus trap, no keyboard dismissal, would need bespoke accessibility work | Medium-High, worse accessibility |
   **Recommendation: install shadcn `alert-dialog`.** Read the article count from `useArticulos(listaId).articulos.length` (read-only) and interpolate it into the confirmation text with correct singular/plural/zero handling in Spanish (e.g. "se perderá 1 artículo" vs "se perderán N artículos" vs "no tiene artículos" for zero) — "¿Seguro?" alone is explicitly rejected by the task file.

4. **Where the create form lives.** `EstadoVacio`'s `children` slot was designed specifically for 049's inline create-list form. Two placements are needed: the empty-list case and the has-lists case.
   **Recommendation:** build one small `crear-lista.tsx` form component (name `input` + submit, using `useListas().crear`) and mount it in both places — as `EstadoVacio`'s `children` when `listas.length === 0`, and pinned above the list otherwise. Single component, single validation path.

5. **Second-member notice (`useHogar().miembros.length < 2`).** Must live entirely inside `modules/listas/ui/listas/**` (cannot touch `shared/hogar/**`, `navegacion-app.tsx`, or `marco-app.tsx` — those are Group C's for task 056). Recommendation: a small informational `Alert` (already installed, `default` variant — not `destructive`, this is not an error) rendered above or below the list, Spanish copy, no call-to-action link (Group A cannot safely link anywhere Group C owns yet).

6. **Touch-target baseline.** Established precedent: shadcn's default button sizes (`h-8`/`h-9`) are topped up to 44px via `cn(buttonVariants(...), 'min-h-11 min-w-11')` — never by editing `button.tsx` itself (`navegacion-app.tsx`, `identidad-usuario.tsx`, `pantalla-acceso.tsx` all do this identically). **Group A must apply the same `min-h-11`/`min-w-11` utility pattern to every new interactive control it ships** so task 057 inherits a consistent baseline.

## Affected Areas

- `frontend/src/routes/_privado/index.tsx` — replace the static placeholder with the real listing.
- `frontend/src/modules/listas/ui/listas/**` (new directory) — list item row, create-list form, rename affordance, delete `alert-dialog` (reads `useArticulos` for the count), second-member `Alert`, and `enlace-lista.tsx` carrying the `@ts-expect-error`'d `Link` to `/listas/$listaId`.
- `frontend/src/shared/ui/` — additive only: new `input.tsx`, `label.tsx`, `alert-dialog.tsx` generated by the shadcn CLI pointed at the existing `components.json`. Existing `button.tsx`/`alert.tsx`/`avatar.tsx` stay untouched.
- Not affected (read-only or out of scope): `useListas.ts`, `useArticulos.ts`, `hogar-contexto.tsx`, `sesion-contexto.tsx`, `hogar-listas.tsx`, `marco-app.tsx`, `navegacion-app.tsx`, `router.tsx`, `providers/query.tsx`, `routeTree.gen.ts` (regenerated by `pnpm generate-routes`, never hand-edited).

## Recommendation

Build one small container in `_privado/index.tsx` (or a thin wrapper it delegates to inside `modules/listas/ui/listas/`) composing: the second-member `Alert` (conditional), a persistent inline create-list form (`input`+`label`, using `useListas().crear`), and either the list (mapped `Lista[]` rows, each with inline-rename and an `alert-dialog`-guarded delete reading `useArticulos(id).articulos.length` for the count) or `EstadoVacio` with that same create form as `children` when `listas.length === 0`. All new interactive elements carry the `min-h-11 min-w-11` touch-target utility. All new copy is Spanish. New shadcn installs: `input`, `label`, `alert-dialog`.

## Risks

- **Article-count race for delete confirmation**: `useArticulos(listaId)` starts `loading:true`/empty before its own collection resolves; if the delete `alert-dialog` opens before `ready` is true, the count shown could read 0 when articles actually exist. Gate the count text on `useArticulos(listaId).ready`, or show a neutral "counting" state instead of a wrong "0 artículos".
- **UI-copy-language inconsistency is pre-existing outside Group A's boundary** (English auth-chrome copy vs. the Spanish product decision) — not a blocker; `docs/00-Vision-y-Modulos.md:44` is canonical and the auth screen is out of scope for Group A.
- **`useArticulos` mounted per-row for the delete count**: N live queries mounted simultaneously on the listing screen. Expected safe (echo-deduplication is a library concern per task 048), but a deliberate tradeoff of simplicity over a hypothetical aggregated count hook that does not exist today.
- **Typed router seam**: the `@ts-expect-error` in `enlace-lista.tsx` needs a real update if Group B's route lands with a different param name than `$listaId` before merge — coordinate via the agreed seam (Engram #538).
- **No `openspec/changes/ui-listas/` directory existed at explore time** — only the Engram half of hybrid persistence was completed by the explore phase; this file was materialized by the propose phase.

## Ready for Proposal

Yes. All five open product points above have an evidence-backed recommendation and were subsequently confirmed by the user in the pre-proposal handoff.
