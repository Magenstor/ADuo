# Design: Shopping List Detail UI

## Technical Approach

Add one private TanStack Router file route and a module-owned UI page. Keep data ownership in existing hooks and domain functions:

- `useListas()` resolves the selected list name and list existence.
- `useArticulos(listaId)` provides article projection and mutations.
- `coincideConBusqueda(article.contenido, consulta)` filters already-loaded items.

The route file only extracts `listaId` and renders `<ListaDetallePage listaId={listaId} />`.

## Architecture Decisions

| Option | Tradeoff | Decision |
| --- | --- | --- |
| Put UI logic in the route file | Fast but makes routing own feature behavior | Reject; keep route thin and module UI reusable/testable. |
| Add shadcn inputs/dialogs | More polished primitives but merge conflict risk with Grupo A | Reject for first slice; use semantic HTML + existing `Button`. |
| Search through query params/query keys | Deep-linkable, but violates story 054 and creates cache churn | Reject; search is local view state only. |
| Hide purchased articles by default | Cleaner list, but contradicts task 050 | Reject; purchased are grouped and visible. |
| Confirmation for article delete/clear purchased | Safer, but not required for Grupo B and adds dialog dependency | Defer; single delete and clear use explicit buttons with labels. |
| Sort in the UI from raw records | Duplicates hook/domain ownership | Avoid; split the hook-provided projection into pending/purchased groups without changing intra-group order. |

## Component Structure

- `frontend/src/routes/_privado/listas.$listaId.tsx`
  - `createFileRoute('/_privado/listas/$listaId')`
  - reads `listaId` from params
  - renders `ListaDetallePage`

- `frontend/src/modules/listas/ui/detalle/lista-detalle-page.tsx`
  - orchestrates hooks and page state
  - local states: `nuevoArticulo`, `consulta`, active edit id/draft
  - derived values: selected list, filtered pending articles, filtered purchased articles
  - event handlers call hook actions and clear local inputs only on `{ ok: true }`

- `frontend/src/modules/listas/ui/detalle/lista-detalle-page.test.tsx`
  - mocks public hooks/domain at module boundaries where needed
  - tests behavior through rendered UI, not implementation internals

- `frontend/src/modules/listas/ui/detalle/index.ts`
  - exports `ListaDetallePage`

## UI / Interaction Details

- Header: back-safe page title using the list name when available; loading/error/not-found states use existing simple UI patterns.
- Add form: text input plus submit button with `min-h-11`; submit disabled for blank trimmed content or while the action is pending if local pending state is introduced.
- Search: labeled input; filters client-side only.
- Article rows:
  - mark/unmark button first, with `min-h-11 min-w-11`.
  - content text; purchased rows use subdued style and completed semantics.
  - edit/delete actions with aria labels.
- Purchased section:
  - rendered after pending section.
  - clear-purchased button disabled when no purchased records exist.
- Empty states:
  - no articles: invite adding the first article.
  - search has no matches: tell the user no articles match the current search.
  - unknown list: tell the user the list is unavailable without showing unrelated articles.

## Data Flow

```text
route params.listaId
  -> ListaDetallePage
  -> useListas() -> selected list display name / not-found
  -> useArticulos(listaId) -> ordered articles and actions
  -> local search filter with coincideConBusqueda
  -> pending group + purchased group
```

No repository, collection, realtime, or query-key code changes are permitted.

## Testing Strategy

Strict TDD focused on `lista-detalle-page.test.tsx`:

1. RED: route/page name and unknown-list behavior.
2. RED: grouping and pending-before-purchased rendering.
3. RED: add success/failure behavior.
4. RED: mark/unmark actions.
5. RED: edit/delete actions.
6. RED: clear-purchased enabled/disabled behavior.
7. RED: search normalization and grouping preservation.
8. RED: tactile/accessibility checks for minimum touch-target classes and labels.
9. GREEN: implement the smallest UI to satisfy tests.
10. REFACTOR: extract local row helpers only if they reduce complexity without expanding scope.

Run focused tests after each step, then generate routes and run full verification.

## Commands

```bash
cd frontend
pnpm test -- src/modules/listas/ui/detalle/lista-detalle-page.test.tsx
pnpm generate-routes
pnpm test -- src/modules/listas/ui/detalle/lista-detalle-page.test.tsx
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm check
pnpm build
```

## Rollout / Migration

No migration. The route becomes active once generated into TanStack Router's route tree. Grupo A's link can 404 until this branch is merged; after both merge, the link resolves.

## Review Workload Forecast

Estimated changed lines: 250–380 additions/deletions including tests and generated route tree. Risk against 400-line budget: medium. Chaining is unlikely required, but if route generation or UI extraction pushes the candidate over budget, split tests/UI and route wiring per the user's `auto-chain` preference.
