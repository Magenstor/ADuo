# Tasks: Shopping Lists Screen (ui-listas)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,550–1,700 additions + deletions (shadcn ~300, authored components ~860, container ~310, wiring+integration test ~125, marco-app amendment ~30) |
| 400-line budget risk | High (against the session's `review_budget_lines: 800`; also High against `openspec/config.yaml`'s stricter default of 400) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: shadcn primitives + `EnlaceLista` + `CrearLista` + `AvisoSegundoMiembro` (≈600–650 lines) → PR 2: `FilaLista` (view+edit) + `EliminarLista` + `ContenidoEliminarLista` (≈550–600 lines) → PR 3: `PantallaListas` + route wiring + `pantalla-listas.ruta.test.tsx` + `marco-app.test.tsx` C2 amendment (≈450–500 lines) |
| Delivery strategy | auto-chain (session-cached) |
| Chain strategy | stacked-to-main (session-cached, same as `hooks-aplicacion-listas`); target branch is `develop`, not `main` |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

**Deviation from the orchestrator's illustrative split**: the suggested example ("PR 1: … + route → PR 2: rename + delete + marco-app amendment") pairs route wiring with PR 1 and the `marco-app.test.tsx` amendment with PR 2. That pairing is unsafe: `marco-app.test.tsx` C2 (lines 127–145) pins the *current* placeholder empty-state copy, and under that harness (`auth`-only mock, no household mock) `useHogar()` resolves `error`. Wiring `index.tsx` to `PantallaListas` without amending C2 in the **same** PR makes C2 fail immediately (the screen would render the household-error banner, not the pinned placeholder heading/description), breaking "each slice green on its own." This plan instead ships all new, unwired files first (PR 1–2, touching no existing test), then wires the route and amends C2 together in PR 3 — the only PR that touches an existing file.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | shadcn primitives + `EnlaceLista`, `CrearLista`, `AvisoSegundoMiembro` (new, unwired files only) | PR 1 | `cd frontend && pnpm test -- src/modules/listas/ui/listas/enlace-lista.test.tsx src/modules/listas/ui/listas/crear-lista.test.tsx src/modules/listas/ui/listas/aviso-segundo-miembro.test.tsx` | N/A — components not mounted into any route yet; proven structurally by unit tests only | Delete the 3 shadcn files and the 3 new component+test file pairs; nothing else references them |
| 2 | `FilaLista` (view+edit), `EliminarLista`, `ContenidoEliminarLista` (new, unwired files only) | PR 2 | `cd frontend && pnpm test -- src/modules/listas/ui/listas/fila-lista.test.tsx src/modules/listas/ui/listas/eliminar-lista.test.tsx src/modules/listas/ui/listas/contenido-eliminar-lista.test.tsx` | N/A — same reason as Unit 1 | Delete the 3 new component+test file pairs; PR 1's files are untouched |
| 3 | `PantallaListas` state machine, route wiring, integration test, `marco-app.test.tsx` C2 amendment | PR 3 | `cd frontend && pnpm test -- src/modules/listas/ui/listas/pantalla-listas.test.tsx src/modules/listas/ui/listas/pantalla-listas.ruta.test.tsx src/app/marco-app.test.tsx src/app/rutas-protegidas.test.tsx` | `cd frontend && pnpm test -- src/modules/listas/ui/listas/pantalla-listas.ruta.test.tsx` exercises the real router + `AppProviders`; manual `cd frontend && pnpm dev` at `/` as a signed-in user is the human-facing check | Revert `routes/_privado/index.tsx` to the placeholder, revert the `marco-app.test.tsx` C2 case, delete `pantalla-listas.tsx`/`.test.tsx`/`.ruta.test.tsx`; PR 1–2 files are untouched |

## 1. Shared UI primitives (PR 1)

- [x] **SETUP** — Run `cd frontend && pnpm exec shadcn add input label alert-dialog`; when prompted to overwrite `button.tsx`, decline. Verify with `git status --porcelain frontend/src/shared/ui/` that exactly `input.tsx`, `label.tsx`, `alert-dialog.tsx` are new and `button.tsx`, `alert.tsx`, `avatar.tsx` are unchanged. <!-- sdd-owner: implementation -->

## 2. `EnlaceLista` — row link seam (PR 1)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/enlace-lista.test.tsx` with a hand-built `createRootRoute` + `createMemoryHistory` harness (copied per-file, per `marco-app-persistencia.test.tsx:54-80`) asserting: the rendered link's accessible name is the list name, its resolved `href` targets `/listas/<listaId>` for the given `lista.id`, and its `className` includes `min-h-11`. Verify it fails: `cd frontend && pnpm test -- src/modules/listas/ui/listas/enlace-lista.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/listas/enlace-lista.tsx`: a `Link` to `/listas/$listaId` with `params: { listaId: lista.id }`, `className={cn(buttonVariants({ variant: 'link' }), 'min-h-11')}`, and exactly one `// @ts-expect-error` line anchoring the not-yet-generated route (design Interfaces/Contracts). If Prettier splits `to`/`params` across lines, spread a `const destino = { to, params }` object first so the directive anchors one diagnostic. Verify the test passes. <!-- sdd-owner: implementation -->
- [x] **SEAM CHECK** — Run `cd frontend && pnpm exec tsc --noEmit` with the `@ts-expect-error` line present (expect zero diagnostics), then temporarily delete only that line and re-run (expect exactly one diagnostic, the unresolved `/listas/$listaId` route), then restore the line. Record both outcomes; do not leave the line removed. <!-- sdd-owner: implementation -->

## 3. `CrearLista` — create-list form (PR 1)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/crear-lista.test.tsx` covering: visible `label` + text `input`, blank/whitespace submission shows an inline validation message and never calls `crear`, a valid submission calls `crear` and disables the submit control (`aria-busy`) until it settles, `ok:true` resets and refocuses the input, `ok:false` shows the error inline and keeps the typed name, submit control carries `min-h-11`. Verify failure: `cd frontend && pnpm test -- src/modules/listas/ui/listas/crear-lista.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/listas/crear-lista.tsx` with props `{ crear }`, client-side blank/whitespace guard, `useState<boolean>` pending flag (D6), and the shadcn `Input`/`Label` from Phase 1. Verify the tests pass. <!-- sdd-owner: implementation -->
- [x] **REFACTOR** — Extract the blank/whitespace validation predicate if reused; rerun `cd frontend && pnpm test -- src/modules/listas/ui/listas/crear-lista.test.tsx`. <!-- sdd-owner: implementation -->

## 4. `AvisoSegundoMiembro` — second-member notice (PR 1)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/aviso-segundo-miembro.test.tsx` covering: renders an informational alert with `role="status"` and no call-to-action, no assertions here couple it to household `estado` (that gating belongs to `PantallaListas`). Verify failure: `cd frontend && pnpm test -- src/modules/listas/ui/listas/aviso-segundo-miembro.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/listas/aviso-segundo-miembro.tsx` using shadcn `Alert` with `role="status"` override (D7: props spread after `role` in `alert.tsx` makes this legal) and the copy "Todavía no hay nadie más en tu hogar." / "Invita a alguien para compartir las listas." Verify the test passes. <!-- sdd-owner: implementation -->

## 5. `FilaLista` — row view and inline rename (PR 2)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/fila-lista.test.tsx` covering: default view mode renders `EnlaceLista` plus a "Renombrar" control (`min-h-11`); entering edit mode swaps the name for a controlled input; Enter/submit calls `renombrar(id, valor)` and exits edit mode on `ok:true`; Escape cancels without calling `renombrar` and restores the prior name; `ok:false` keeps edit mode, shows the inline `role="alert"` message, and retains the attempted value; "Guardar"/"Cancelar" controls carry `min-h-11`. Verify failure: `cd frontend && pnpm test -- src/modules/listas/ui/listas/fila-lista.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/listas/fila-lista.tsx` as an `<li>` owning local `editando`/`borrador`/`pendiente`/`errorFila` state (D3): view mode composes `EnlaceLista`; edit mode is a form whose submit commits and whose Escape-key handler cancels; blur is a no-op. Verify the tests pass. <!-- sdd-owner: implementation -->
- [x] **REFACTOR** — Extract the edit-mode form markup if it grows past one readable block; rerun `cd frontend && pnpm test -- src/modules/listas/ui/listas/fila-lista.test.tsx`. <!-- sdd-owner: implementation -->

## 6. `ContenidoEliminarLista` — count-aware dialog body (PR 2)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/contenido-eliminar-lista.test.tsx` (mocking `useArticulos`, per `useListas.test.tsx`'s `vi.hoisted` + `vi.mock('@/modules/listas')` precedent) covering the four wording rows: `!ready` → neutral `role="status"` counting text, never a literal zero; `ready` + 0 → "Esta lista no tiene artículos."; `ready` + 1 → "Se perderá 1 artículo."; `ready` + n>1 → "Se perderán {n} artículos."; confirm calls `eliminar(lista.id)` then `alCerrar()`; cancel calls only `alCerrar()`. Verify failure: `cd frontend && pnpm test -- src/modules/listas/ui/listas/contenido-eliminar-lista.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/listas/contenido-eliminar-lista.tsx` with props `{ lista, eliminar, alCerrar }`, calling `useArticulos(lista.id)` internally (D2: mounted only while the dialog is open, so this component must be a child of `AlertDialogContent`, never rendered standalone by the trigger). Verify the tests pass. <!-- sdd-owner: implementation -->

## 7. `EliminarLista` — delete trigger and controlled dialog (PR 2)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/eliminar-lista.test.tsx` covering: a "Eliminar" trigger (`min-h-11`) opens the `alert-dialog`; `ContenidoEliminarLista` mounts only while open (D2, Radix mounts content only while open — assert it is absent before opening); `AlertDialogAction` is disabled while `!ready` or pending (D8); confirming calls `preventDefault` so an `ok:false` result keeps the dialog open with an inline `role="alert"` instead of closing; a successful confirm closes the dialog. Verify failure: `cd frontend && pnpm test -- src/modules/listas/ui/listas/eliminar-lista.test.tsx`. If `userEvent` refuses clicks under jsdom due to `pointer-events: none` on `body`, use `userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })` per the design's Testing Strategy note. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/listas/eliminar-lista.tsx` with props `{ lista, eliminar }`, controlled `open` state (D8), rendering `AlertDialogContent` → `ContenidoEliminarLista` as a child. Verify the tests pass. <!-- sdd-owner: implementation -->
- [x] **REFACTOR** — Consolidate the `preventDefault`/pending-guard logic between `EliminarLista` and `CrearLista`'s pending pattern if duplicated; rerun `cd frontend && pnpm test -- src/modules/listas/ui/listas/eliminar-lista.test.tsx src/modules/listas/ui/listas/contenido-eliminar-lista.test.tsx src/modules/listas/ui/listas/fila-lista.test.tsx`. <!-- sdd-owner: implementation -->
  - Deviation (noted, not silent): design's `FilaLista` interface and Data Flow diagram already declared `eliminar` on `FilaLista` and nested `EliminarLista` under it. Phase 5's own RED/GREEN text omitted that prop, so it was added here once `EliminarLista` existed, with its own RED/GREEN pair (`fila-lista.test.tsx`: "renders an Eliminar trigger passing the eliminar prop through to the row"), keeping every commit test-driven.

## 8. `PantallaListas` — screen state machine (PR 3)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/pantalla-listas.test.tsx` (`vi.mock('@/modules/listas')` + `vi.mock('@/shared/hogar/hogar-contexto')`, per `useListas.test.tsx`) covering, in the priority order from spec Requirement "Household-gated screen state": (1) `loading`/`!listas.ready` → loading indicator only; (2) `sin-hogar` → `EstadoVacio` "Todavía no formas parte de un hogar" with no form; (3) `error` → destructive `role="alert"` banner, no rows, no form; (4) `ready` + zero lists → `EstadoVacio` "Todavía no tienes listas" with `CrearLista` as children; (5) `ready` + ≥1 lists → `CrearLista` above a `<ul aria-label="Listas de la compra">` of `FilaLista`; a `persistence`/`query` mutation error overlays states 4–5 as a banner above the form without replacing them with state 3; a `validation` error never reaches the banner; the second-member notice (`AvisoSegundoMiembro`) shows only when `hogar.estado === 'ready' && miembros.length < 2`; `<h2>Listas</h2>` renders in every state. Verify failure: `cd frontend && pnpm test -- src/modules/listas/ui/listas/pantalla-listas.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/listas/pantalla-listas.tsx`: calls `useHogar()` and `useListas()` once, resolves the 5-state machine per D10's evaluation order, maps `error.tipo` to banner copy (never the raw SDK message, D5), and passes `crear`/`renombrar`/`eliminar` down as props. Note: in states 2 and 4, `<h2>Listas</h2>` and `EstadoVacio`'s own `<h2>` both render (two headings) — this is expected per D10 and is exercised only in this file's mocked-hooks tests, never in the household-error harness below. Verify the tests pass. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE** — Extend `pantalla-listas.test.tsx` with: a rename `ok:false` on a populated screen keeps the list visible and does not fall back to state 3 (spec scenario "A persistence or query mutation error overlays without emptying the screen"); deleting the only remaining list transitions state 5 → state 4. Verify: `cd frontend && pnpm test -- src/modules/listas/ui/listas/pantalla-listas.test.tsx`. <!-- sdd-owner: implementation -->
  - Implementation note: the last-list-deletion transition needed an explicit ancestor `useState` tick (`forzarRerender`, wrapped in `act`) to force `PantallaListas` to re-invoke against the updated mocked `useListas()` value — a bare `rerender()` of the same `<RouterProvider>` element, and `router.invalidate()`, both leave TanStack Router's store-subscribed `Match` unchanged since neither touches router state.
- [x] **REFACTOR** — Extract the `error.tipo` → banner-copy map into a small private helper; rerun `cd frontend && pnpm test -- src/modules/listas/ui/listas/pantalla-listas.test.tsx`. <!-- sdd-owner: implementation -->
  - Done during GREEN as `COPIA_BANNER` + `copiaBanner()`; no separate pass needed.

## 9. Route wiring and integration (PR 3)

- [x] **RED** — Create `frontend/src/modules/listas/ui/listas/pantalla-listas.ruta.test.tsx` following the design's Testing Strategy "Integration" row: `marco-app.test.tsx` harness plus mocks of `@/shared/hogar/hogar-repository` (`resolverHogar` ready, ≥1 miembro), `@/modules/listas/application/hogar-listas` (passthrough), and `@/modules/listas`; assert the screen renders inside `<main>` with a populated list and `href="/listas/<id>"` on a row link. Verify failure: `cd frontend && pnpm test -- src/modules/listas/ui/listas/pantalla-listas.ruta.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Modify `frontend/src/routes/_privado/index.tsx` to import and render `PantallaListas` (deep path per D1, not the shared barrel) in place of the placeholder `EstadoVacio` call. Verify the new test passes. <!-- sdd-owner: implementation -->
- [x] **AMEND (required in this same unit)** — Modify the C2 case of `frontend/src/app/marco-app.test.tsx` ("renders the empty-state título and descripción…", lines 127–145): under this file's `auth`-only mock, `useHogar()` resolves `error` (no household mock is registered here), so after wiring, the screen renders the household-error banner (state 3), not the old placeholder copy. Replace the assertions to expect: a `role="alert"` banner inside `<main>`, `<h2>Listas</h2>` as the sole heading (state 3 renders no `EstadoVacio`, so exactly one `<h2>` — do not assert two headings here, that shape only exists in states 2/4 covered by Phase 8), and `within(main).queryAllByRole('listitem')` has length 0. Do not touch `marco-app.test.tsx:100-107` ("renders exactly one heading…") or `rutas-protegidas.test.tsx:83,143` — both already assert a single heading with no count literal and stay green unmodified because state 3 renders exactly one `<h2>`. Verify: `cd frontend && pnpm test -- src/app/marco-app.test.tsx src/app/rutas-protegidas.test.tsx`. <!-- sdd-owner: implementation -->

## 10. Full regression (PR 3, before opening any PR)

- [x] **VERIFY** — Run, all from `frontend/`: `pnpm test`, `pnpm run lint`, `pnpm exec prettier --check .` (or `pnpm run check`), `pnpm exec tsc --noEmit`. All four must be clean before PR 3 is opened; PR 1 and PR 2 each re-run the same four commands scoped to their own slice as their closing task. <!-- sdd-owner: implementation -->
  - Result: `pnpm test` 267/267 passed (36 files); `pnpm run lint` clean; `pnpm exec prettier --check .` clean; `pnpm exec tsc --noEmit` zero diagnostics — all on `feat/ui-listas-3-pantalla`. Each of `feat/ui-listas-1-primitivas` and `feat/ui-listas-2-filas` was independently verified green at its own tip before the next slice branched.

## Rollback Boundaries

- PR 1/PR 2 revert independently: delete the listed new component+test file pairs; nothing else in the tree references them until PR 3 wires the route.
- PR 3 reverts `routes/_privado/index.tsx` to the placeholder and the `marco-app.test.tsx` C2 case to its pre-change assertions, then deletes `pantalla-listas.tsx`/`.test.tsx`/`.ruta.test.tsx`.
- No schema, migration, or `household-context`/hook changes are made; nothing there needs rollback.

## Post-Merge Manual Step (not a task in this change)

`docs/tareas/*` is user-maintained and is intentionally not edited by this change. After PR 3 merges, the user manually marks tasks 049/052/055 done in `docs/tareas/000-indice.md` and the corresponding task files.
