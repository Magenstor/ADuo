# Tasks: Shopping List Detail UI

## Review Workload Forecast

| Field | Value |
| --- | --- |
| Estimated changed lines | 250–380 additions/deletions plus generated route tree delta |
| 400-line budget risk | Medium |
| Chained PRs recommended | No for first implementation; auto-chain if actual diff exceeds budget |
| Delivery strategy | auto-chain |
| Review budget | 400 changed lines |

Decision needed before apply: No.

## 1. Route shell and selected-list state

- [x] **RED** — Add `frontend/src/modules/listas/ui/detalle/lista-detalle-page.test.tsx` cases proving the page displays the selected list name when `useListas` contains `listaId`, and shows an unavailable-list empty state without rendering unrelated articles when it does not. Verify failure with `cd frontend && pnpm test -- src/modules/listas/ui/detalle/lista-detalle-page.test.tsx`. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Create `frontend/src/modules/listas/ui/detalle/lista-detalle-page.tsx` and `index.ts` with the smallest implementation consuming `useListas` and `useArticulos(listaId)` to satisfy selected-list and unavailable-list states. Verify the focused test passes. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Add `frontend/src/routes/_privado/listas.$listaId.tsx` as a thin route shell that reads `listaId` and renders `ListaDetallePage`; do not manually edit `routeTree.gen.ts`. Verify with the focused test if route import affects compilation. <!-- sdd-owner: implementation -->

## 2. Article grouping and add/toggle actions

- [x] **RED** — Extend the page test with pending and purchased articles proving pending rows render before a purchased section and purchased rows remain visible. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Split the hook-provided ordered article projection into pending and purchased groups without changing intra-group order. Verify the focused test passes. <!-- sdd-owner: implementation -->
- [x] **RED** — Add tests for adding an article: `agregar` receives submitted content, successful result clears the input, and failed result preserves the input. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Implement the add form with a labeled input, existing `Button`, trimmed submission, and success-only clearing. Verify focused tests pass. <!-- sdd-owner: implementation -->
- [x] **RED** — Add tests that toggling a pending row calls `marcar(id)` and toggling a purchased row calls `desmarcar(id)`. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Implement mark/unmark controls with accessible labels and minimum touch-target classes. Verify focused tests pass. <!-- sdd-owner: implementation -->

## 3. Edit, delete, and clear purchased

- [x] **RED** — Add tests for editing a single article: enter edit mode, submit a changed draft, and call `editar(id, contenido)` without affecting another row. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Implement local edit mode/draft state per active row and submit through `editar`. Verify focused tests pass. <!-- sdd-owner: implementation -->
- [x] **RED** — Add tests that row delete calls `eliminar(id)` with an accessible label for the selected article. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Implement row delete control. Verify focused tests pass. <!-- sdd-owner: implementation -->
- [x] **RED** — Add tests that clear purchased calls `limpiarComprados` when purchased articles exist and is disabled/inert when there are none. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Implement clear-purchased control for the purchased group. Verify focused tests pass. <!-- sdd-owner: implementation -->

## 4. Search and tactile ergonomics

- [x] **RED** — Add tests proving search for `azucar` finds `Azúcar`, filters through `coincideConBusqueda`, and preserves pending-before-purchased grouping. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Implement local `consultaBusqueda` state and client-side filtering using `coincideConBusqueda`; do not touch query keys, repositories, or hooks. Verify focused tests pass. <!-- sdd-owner: implementation -->
- [x] **RED** — Add tactile/accessibility tests asserting add and mark controls include 44px minimum target classes (`min-h-11`, and `min-w-11` for compact/icon controls) and compact actions have accessible names. Verify failure. <!-- sdd-owner: implementation -->
- [x] **GREEN** — Apply mobile-first layout and touch-target classes to primary controls. Verify focused tests pass. <!-- sdd-owner: implementation -->
- [x] **REFACTOR** — Extract small private row/section helpers only if the page is hard to read; keep them under `modules/listas/ui/detalle/**`. Re-run the focused test. <!-- sdd-owner: implementation -->

## 5. Route generation and verification

- [x] **GREEN** — Run `cd frontend && pnpm generate-routes` to update `frontend/src/routeTree.gen.ts`; resolve generated conflicts only by regenerating. <!-- sdd-owner: implementation -->
- [x] **REPORT** — Record RED/GREEN evidence and final diff size in `openspec/changes/ui-compra-detalle-lista/apply-progress.md`. <!-- sdd-owner: implementation -->

## Verification Handoff

The following commands are verification evidence for `sdd-verify` to rerun independently. They are not implementation task-progress checkboxes.

- **VERIFY** — Run `cd frontend && pnpm test -- src/modules/listas/ui/detalle/lista-detalle-page.test.tsx`.
- **VERIFY** — Run `cd frontend && pnpm test`.
- **VERIFY** — Run `cd frontend && pnpm exec tsc --noEmit`, `cd frontend && pnpm lint`, `cd frontend && pnpm check`, and `cd frontend && pnpm build`.

## Rollback Boundaries

- Revert `frontend/src/routes/_privado/listas.$listaId.tsx`, `frontend/src/modules/listas/ui/detalle/**`, and generated `frontend/src/routeTree.gen.ts` changes together.
- Do not revert or alter application hooks, repositories, collections, realtime, shared household code, or navigation shell files for this change.
