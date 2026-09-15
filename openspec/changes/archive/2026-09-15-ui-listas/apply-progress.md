# Apply Progress: Shopping Lists Screen (ui-listas)

**Mode**: Strict TDD
**Status**: All 10 phases / 26 sub-tasks complete (`tasks.md` fully `[x]`).

## Branches and Commits

| Branch (from) | Tip commit | Scope |
|---|---|---|
| `feat/ui-listas-1-primitivas` (from `develop`) | `docs(openspec): mark ui-listas PR1 tasks complete` (uncommitted until slice 3; see below) | shadcn `input`/`label`/`alert-dialog` + `EnlaceLista` + `CrearLista` + `AvisoSegundoMiembro` |
| `feat/ui-listas-2-filas` (from slice 1) | `feat(frontend): compose the delete trigger inside each list row` | `FilaLista` + `ContenidoEliminarLista` + `EliminarLista` + shared `usePendiente` |
| `feat/ui-listas-3-pantalla` (from slice 2) | this apply-progress + final `tasks.md` commit | `PantallaListas` + route wiring + integration test + `marco-app.test.tsx` C2 amendment |

Per the launch instructions, `tasks.md`/`apply-progress.md` updates were kept uncommitted across slices and land together in this final slice-3 commit, alongside the final `tasks.md`.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1 SETUP | n/a (CLI) | n/a | N/A (new) | n/a | ✅ verified 3 files only | ➖ | ➖ |
| 2 `EnlaceLista` | `enlace-lista.test.tsx` | Unit (router) | N/A (new) | ✅ Written | ✅ Passed | ✅ 2 list-ids + class check | ➖ None needed |
| 2 SEAM CHECK | n/a (tsc) | n/a | N/A | n/a | ✅ 0 diagnostics with line, 1 without | n/a | n/a |
| 3 `CrearLista` | `crear-lista.test.tsx` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 7 cases | ✅ extracted `nombreValido` |
| 4 `AvisoSegundoMiembro` | `aviso-segundo-miembro.test.tsx` | Unit | N/A (new) | ✅ Written | ✅ Passed | ➖ Single scenario | ➖ None needed |
| 5 `FilaLista` | `fila-lista.test.tsx` | Unit (router) | N/A (new) | ✅ Written | ✅ Passed (after async-router fix) | ✅ 7 cases | ➖ None needed at Phase 5; later extended (see deviation note) |
| 6 `ContenidoEliminarLista` | `contenido-eliminar-lista.test.tsx` | Unit (hooks mocked) | N/A (new) | ✅ Written | ✅ Passed | ✅ 9 cases (4 wording rows + confirm/cancel/error/disabled/class) | ➖ None needed |
| 7 `EliminarLista` | `eliminar-lista.test.tsx` | Unit (hooks mocked) | N/A (new) | ✅ Written | ✅ Passed | ✅ 5 cases | ✅ extracted shared `usePendiente` (CrearLista, FilaLista, ContenidoEliminarLista) |
| 7b `FilaLista` + `eliminar` (deviation) | `fila-lista.test.tsx` (extended) | Unit (router) | ✅ 251/251 before change | ✅ Written | ✅ Passed | ➖ Single scenario | ➖ None needed |
| 8 `PantallaListas` | `pantalla-listas.test.tsx` | Unit (hooks mocked, router) | N/A (new) | ✅ Written | ✅ Passed (after async-router fix) | ✅ rename-ok:false + delete-transition (needed `forzarRerender`/`act`) | ✅ `COPIA_BANNER`/`copiaBanner` done during GREEN |
| 9 Route wiring | `pantalla-listas.ruta.test.tsx` | Integration | N/A (new) | ✅ Written | ✅ Passed | ➖ Single scenario | ➖ None needed |
| 9 AMEND | `marco-app.test.tsx` (C2) | Integration | ✅ 266/267 baseline (1 pre-amend fail as predicted) | ✅ (amendment is itself the RED→GREEN pair) | ✅ Passed | ➖ | ➖ |
| 10 VERIFY | full suite | n/a | n/a | n/a | ✅ 267/267, lint/prettier/tsc clean | n/a | n/a |

## Test Summary

- **Total tests written**: 267 (across 36 test files)
- **Total tests passing**: 267/267
- **Layers used**: Unit (presentational) ~230, Unit (hooks mocked) ~24, Router-context unit ~13, Integration 1
- **Approval tests** (refactoring): None — no refactoring-of-existing-behavior tasks; the `marco-app.test.tsx` C2 amendment replaced a now-incorrect pinned assertion per an explicit, pre-declared boundary amendment (Engram #546), not an approval-test refactor.
- **Pure functions created**: `nombreValido` (`validacion.ts`), `copiaBanner`/`textoConteo` (private helpers), `usePendiente` (shared hook, not pure but side-effect-isolated)

## Work Unit Evidence (per chained-PR slice)

| Unit | Focused test command | Result | Runtime harness | Result | Rollback boundary |
|---|---|---|---|---|---|
| PR 1 | `pnpm test -- src/modules/listas/ui/listas/enlace-lista.test.tsx src/modules/listas/ui/listas/crear-lista.test.tsx src/modules/listas/ui/listas/aviso-segundo-miembro.test.tsx` | Pass (full suite 230/230 at slice tip) | N/A — unwired, structural only | N/A | Delete `shared/ui/{input,label,alert-dialog}.tsx` + the 3 component/test pairs; nothing else references them |
| PR 2 | `pnpm test -- src/modules/listas/ui/listas/fila-lista.test.tsx src/modules/listas/ui/listas/eliminar-lista.test.tsx src/modules/listas/ui/listas/contenido-eliminar-lista.test.tsx` | Pass (full suite 251/251 at slice tip) | N/A — unwired, structural only | N/A | Delete the 3 new component/test pairs + `pendiente.ts`; PR 1 untouched |
| PR 3 | `pnpm test -- src/modules/listas/ui/listas/pantalla-listas.test.tsx src/modules/listas/ui/listas/pantalla-listas.ruta.test.tsx src/app/marco-app.test.tsx src/app/rutas-protegidas.test.tsx` | Pass (full suite 267/267) | `pnpm test -- src/modules/listas/ui/listas/pantalla-listas.ruta.test.tsx` (real router + `AppProviders`); manual `pnpm dev` check recommended before merge | Pass | Revert `routes/_privado/index.tsx` to placeholder, revert `marco-app.test.tsx` C2, delete `pantalla-listas.tsx`/`.test.tsx`/`.ruta.test.tsx`; PR 1–2 untouched |

## Deviations from Design

1. **`FilaLista` + `eliminar` composition timing**: design's Interfaces/Contracts block and Data Flow diagram declared `FilaLista: { lista; renombrar; eliminar }` with `EliminarLista` nested under it, but Phase 5's own RED/GREEN task text omitted the `eliminar` prop and any `EliminarLista` composition. Implemented Phase 5 literally first (rename-only), then — once `EliminarLista` existed (Phase 7) — added `eliminar` to `FilaLista`'s signature and composed `EliminarLista` alongside "Renombrar", with its own dedicated RED/GREEN test pair. Every commit stayed test-driven; no untested prop was ever added.
2. **Banner copy strings**: design D5 mandates mapping `error.tipo` to banner copy "never the raw SDK message" but does not specify the exact Spanish strings. Authored: `persistence` → "No se pudo guardar el cambio. Intenta de nuevo."; `query` → "No se pudo cargar la información. Intenta de nuevo."; `realtime` → "No se pudo conectar con tu hogar. Intenta recargar la página."
3. **Test harness for the last-list-deletion transition**: neither a bare `rerender()` of the same `<RouterProvider>` element nor `router.invalidate()` causes TanStack Router's `Match` to re-invoke `PantallaListas` after an external mock value changes (it's store-subscribed, not prop-subscribed). Used a small ancestor `useState` tick (`forzarRerender`, wrapped in `act`) local to that one test's harness instead.

None of these deviate from the spec's observable requirements — all are implementation/test-authoring details, and each is reflected as an inline note in `tasks.md`.

## Issues Found

None blocking. The shadcn CLI's generated `input.tsx`/`label.tsx`/`alert-dialog.tsx` needed a `prettier --write` pass to match the project's existing style (matching the precedent already set by the pre-existing `button.tsx`/`alert.tsx`/`avatar.tsx`, which pass `prettier --check` today) — folded into the `chore(frontend): add shadcn input, label and alert-dialog` commit, no logic changed.

## Remediation after verify (`pass_with_warnings`, Engram #554)

`openspec/changes/ui-listas/verify-report.md` raised three WARNINGs (0 blockers, 0 critical findings). All three are fixed, each on the slice branch that owns the file, then the downstream slices were rebased so the chain stays linear.

### W1 — Out-of-boundary `cn` dependency + lockfile drift

- **Fix**: repointed `frontend/src/shared/ui/{input,label,alert-dialog}.tsx` from `import { cn } from 'cn'` to `import { cn } from '@/shared/lib/utils'` (same signature, matches `button.tsx`/`alert.tsx`/`avatar.tsx` and `components.json`'s `utils` alias). Removed `"cn": "^0.3.0"` from `frontend/package.json`. Since that left `package.json` byte-identical to `develop`, `frontend/pnpm-lock.yaml` was restored from `develop` outright (`git checkout develop -- frontend/pnpm-lock.yaml`) rather than regenerated — `@tanstack/react-router`/`-devtools`/`router-plugin` are pinned to `"latest"` in `package.json`, so a fresh `pnpm install` risked re-drifting those versions again. Verified with `pnpm install --frozen-lockfile` (accepted the restored lockfile, removed only the 8 `cn`-related packages from `node_modules`) and `rg -n "from 'cn'" frontend/src` (no hits).
- **Verification**: `git diff develop -- frontend/package.json frontend/pnpm-lock.yaml` is empty on the final `feat/ui-listas-1-primitivas` tip.
- **Commit**: `fix(frontend): import cn from the shared utils alias` on `feat/ui-listas-1-primitivas`.

### W2 — Raw domain tokens / SDK messages in inline error copy

- **Fix**: added `frontend/src/modules/listas/ui/listas/copia-error.ts` exporting `copiaErrorLista(error: ErrorAplicacion): string`, mapping `tipo === 'validation'` messages `nombre-vacio`/`nombre-demasiado-largo` (the exact tokens `crearLista()` in `domain/lista.ts` produces via `fallo('validation', ...)`) to Spanish copy, any `persistence`/`query`/`realtime` to one generic retry message, and any other validation message to a generic fallback. Reused in `crear-lista.tsx`, `fila-lista.tsx`, and `contenido-eliminar-lista.tsx` in place of `resultado.error.message`.
- **`pantalla-listas.tsx`'s `copiaBanner()`**: checked per the remediation instruction — it already maps `error.tipo` to its own Spanish copy and never prints a raw message, so it was left unchanged. Note: its wording ("Intenta de nuevo.") differs slightly from `copia-error.ts`'s inline copy ("Inténtalo de nuevo."); both are correct Spanish and neither leaks raw text, so this cosmetic inconsistency was left as-is (out of the remediation's explicit scope).
- **Known limitation (not exercised by any test)**: `ContenidoEliminarLista` also routes through `copiaErrorLista`. `useListas().eliminar`'s own local unavailability message (`'La lista no está disponible'`, already Spanish, tipo `validation`) is not one of the two known tokens, so it would fall through to the generic `'El nombre no es válido.'` fallback — a wording mismatch (the message is about the list, not a name) for an edge case that requires the household/list to change mid-session. Following the remediation instruction's literal mapping; flagging here for a future follow-up rather than silently special-casing it.
- **Tests (RED first, per file)**: each of `crear-lista.test.tsx`, `fila-lista.test.tsx`, `contenido-eliminar-lista.test.tsx`, and `eliminar-lista.test.tsx` (composes `ContenidoEliminarLista` for real) had its existing raw-message `ok:false` case rewritten to assert the mapped Spanish copy and the ABSENCE of the raw token/message, plus a new dedicated `persistence`-tipo case per component confirming the generic retry copy. `pantalla-listas.test.tsx`'s own rename-failure TRIANGULATE test needed the same update as a consequence of `FilaLista`'s fix, inherited through the slice 2→3 rebase.
- **Commits**: `fix(frontend): show Spanish copy for domain and persistence errors` on `feat/ui-listas-1-primitivas` (CrearLista) and on `feat/ui-listas-2-filas` (FilaLista + ContenidoEliminarLista); `fix(frontend): update pantalla-listas rename-failure test for mapped copy` on `feat/ui-listas-3-pantalla` (consequential test-only fix).

### W3 — Missing `min-w-11` touch baseline

- **Fix**: added `min-w-11` next to `min-h-11` on every new interactive control: `EnlaceLista`'s row link, `CrearLista`'s submit, `FilaLista`'s Renombrar/Guardar/Cancelar, `EliminarLista`'s trigger, and `ContenidoEliminarLista`'s confirm/cancel. `PantallaListas` itself owns no new controls (only composes the above), so no change was needed there.
- **Tests**: extended each component's existing `min-h-11` structural assertion to also assert `/\bmin-w-11\b/`, RED first (confirmed the new assertion failed against the pre-fix class list), then GREEN.
- **Commits**: `style(frontend): add min-w-11 touch baseline to list controls` on `feat/ui-listas-1-primitivas` (EnlaceLista) and on `feat/ui-listas-2-filas` (EliminarLista); folded into the W2 commits above for `CrearLista`, `FilaLista`, and `ContenidoEliminarLista` since those files already had W2 edits in the same pass.

### Post-remediation verification (each slice tip, after rebasing)

| Slice | `pnpm test` | `pnpm exec tsc --noEmit` | `pnpm run lint` | `pnpm run check` |
|---|---|---|---|---|
| `feat/ui-listas-1-primitivas` | 231/231 | clean | clean | clean |
| `feat/ui-listas-2-filas` | 253/253 | clean | clean | clean |
| `feat/ui-listas-3-pantalla` | 269/269 | clean | clean | clean |

Chain stays linear: `develop` → `feat/ui-listas-1-primitivas` → `feat/ui-listas-2-filas` → `feat/ui-listas-3-pantalla`, rebased with `git rebase --autostash` (slice 2) and `git rebase --autostash --onto` (slice 3, to avoid replaying slice 2's pre-remediation commits) so the user's pre-existing uncommitted edits to `.atl/skill-registry.md`/`docs/tareas/*.md` were preserved untouched throughout (never staged, never committed).
