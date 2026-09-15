# Proposal: Shopping Lists Screen (tasks 049, 052, 055)

## Intent

`frontend/src/routes/_privado/index.tsx` is still a static placeholder. The application hooks (047–048) are merged, so the first real screen can ship: list the household's shopping lists, create, rename, and delete them, and never show a blank page. Group A owns this screen in parallel with Groups B (detail route) and C (household naming).

## Scope

### In Scope
- Listing of `useListas().listas`, loading state via `EstadoCarga`, error surfaced from the hook.
- Create list: one reusable component (name `input` + visible `label` + submit) rendered as `EstadoVacio` `children` when there are no lists, and above the list otherwise.
- Rename inline in the row (edit-in-place; Enter/save commits, Escape/cancel reverts).
- Delete through shadcn `alert-dialog` whose text states the article count from `useArticulos(listaId).articulos.length`, with a neutral "counting" state while not `ready` and zero/singular/plural Spanish wording.
- Each row links to `/listas/$listaId` via `enlace-lista.tsx` behind the agreed `@ts-expect-error` seam.
- Second-member notice: informational shadcn `Alert` (default variant, no CTA) when `useHogar()` is `ready` and `miembros.length < 2`.
- Additive shadcn installs: `input`, `label`, `alert-dialog`.
- All UI copy in Spanish, no i18n. All new controls carry `min-h-11 min-w-11`.

### Out of Scope
- Detail route `/listas/$listaId` and article UI (Group B, 050/051/053/054/057).
- `display_name` editing and any change under `shared/hogar/**` (Group C, 056).
- `marco-app.tsx`, `navegacion-app.tsx`, hooks, providers, `routeTree.gen.ts`.
- Editing existing `button.tsx`, `alert.tsx`, `avatar.tsx`.

## Capabilities

### New Capabilities
- `shopping-lists-screen`: listing, create, inline rename, count-aware delete confirmation, empty state, and second-member notice for the household lists screen.

### Modified Capabilities
None. `shopping-application-hooks` and `household-context` are consumed read-only.

## Approach

Thin route file delegating to a container in `modules/listas/ui/listas/`. Composition: conditional second-member `Alert`; create form; then either `EstadoVacio` (form as `children`) or the mapped rows. Each row owns local edit state and its delete dialog; the article count comes from `useArticulos` per row or only inside the open dialog (design decides; accepted tradeoff). Mutation results (`Resultado`) drive inline feedback; the hooks already roll back on failure. Strict TDD: tests mock boundary hooks (`useListas`, `useArticulos`, `useHogar`) as in `useListas.test.tsx`, plus one route integration test following `rutas-protegidas.test.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/routes/_privado/index.tsx` | Modified | Placeholder replaced by the container |
| `frontend/src/modules/listas/ui/listas/**` | New | Container, row, create form, delete dialog, notice, `enlace-lista.tsx`, colocated tests |
| `frontend/src/shared/ui/{input,label,alert-dialog}.tsx` | New | shadcn CLI output |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Wrong "0 artículos" before `useArticulos` is ready | Med | Neutral counting state gated on `ready` |
| N `useArticulos` per row | Low | Accepted; design may confine it to the open dialog |
| `@ts-expect-error` seam breaks after Group B merges | High (expected) | Second merger removes the line (Engram #538) |
| Review budget (800 lines) exceeded by three shadcn files | Med | Generated files reported separately in the tasks forecast |

## Rollback Plan

Revert the branch commits: restore the placeholder `index.tsx`, delete `modules/listas/ui/listas/` and the three generated shadcn files. No data or schema changes.

## Dependencies

- Merged hooks (#5–#8); boundary contract (Engram #536); link seam (#538); exploration (#540).
- shadcn CLI against the existing `components.json`.

## Success Criteria

- [ ] Creating a list on one device shows it on another without reload (049).
- [ ] Delete confirmation states the exact article count; deleting removes articles everywhere (052).
- [ ] Deleting the last list shows the empty state with the create form (055).
- [ ] Single-member household shows the informational notice.
- [ ] `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` pass (except the intended seam directive once B merges).
