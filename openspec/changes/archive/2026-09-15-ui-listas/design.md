# Design: Shopping Lists Screen (ui-listas)

## Technical Approach

Container/presentational split inside the module's UI layer. `PantallaListas` (container) calls `useHogar()` and `useListas()` once, resolves the screen state, and passes `crear`/`renombrar`/`eliminar` down as props; every other component is presentational and testable with plain `vi.fn()` props. The route file only registers the container. Hooks are consumed through the public barrel `@/modules/listas`; nothing under `application/` or `shared/hogar/**` changes (boundary #536).

## Architecture Decisions

| # | Option | Tradeoff | Decision |
|---|---|---|---|
| D1 | Route file holds the screen vs thin route delegating to `pantalla-listas.tsx` | Route files are route-generator input and cannot host colocated tests (no `routeFileIgnorePattern` in `vite.config.ts`, so `routes/**/*.test.tsx` would become routes) | Thin route: `index.tsx` imports `PantallaListas` by deep path (the barrel is shared with Group B and stays untouched). |
| D2 | `useArticulos(listaId)` per row vs only inside the open dialog | Per row: N live queries and N row re-renders on any article echo, for a number needed only on demand | Mount it in `ContenidoEliminarLista`, rendered as a child of `AlertDialogContent` (Radix mounts content only while open). One live query, alive only during confirmation; the collection is already preloaded by `HogarListas`, so `ready` is near-immediate. |
| D3 | Rename state: per-row local vs lifted to the container | Lifting couples rows and re-renders the list on each keystroke | `FilaLista` owns `editando`, `borrador`, `pendiente`, `errorFila`. Enter (form submit) commits, Escape cancels, blur does nothing (mobile tap on "Guardar" blurs first). Empty/whitespace blocked client-side; unchanged name exits without calling `renombrar`; `ok:false` keeps edit mode and shows the inline message (hook already rolled back). |
| D4 | One `CrearLista` component vs two forms | Two forms duplicate validation and tests | One component, props `{ crear }`; rendered as `EstadoVacio` children when empty, above the `<ul>` otherwise. Pending: `aria-busy` on the form and disabled submit only (disabling the focused input drops focus); reset and refocus the input on `ok:true`; inline error on `ok:false`. |
| D5 | Screen-level `Alert` shows every `useListas().error` vs only non-validation | The hook stores validation failures too; showing them twice (inline + banner) is noise | Banner (`variant="destructive"`, `role="alert"`) only for `tipo !== 'validation'`, copy mapped by `tipo` (never the raw SDK message). |
| D6 | Pending flag: `useState` vs `useTransition` | No urgent/non-urgent split here; the flag only disables one control | `useState<boolean>` in the issuing component; deterministic under `act()`. |
| D7 | Second-member notice: shadcn `Alert` default `role="alert"` vs `role="status"` | `role="alert"` announces assertively; the notice is informational and persistent | `<Alert role="status">` (props spread after `role` in `alert.tsx`, so the override is legal). No CTA. |
| D8 | Delete confirm enabled immediately vs gated on `ready` | Task 052 requires the user to see the count | `AlertDialogAction` disabled while `!ready` or pending; `preventDefault` on click so `ok:false` keeps the dialog open with an inline `role="alert"`; controlled `open` state lives in `EliminarLista`. |
| D9 | shadcn via `npx shadcn@latest` vs the pinned devDependency | `shadcn` is pinned in `frontend/package.json` | `cd frontend && pnpm exec shadcn add input label alert-dialog`; decline any overwrite prompt for `button.tsx`; verify only three new files under `shared/ui/`. Generated files stay untouched: `h-11` on inputs and `min-h-11 min-w-11` on buttons are call-site classes. |
| D10 | Screen heading | `EstadoVacio` already renders an `<h2>` | Always render `<h2>Listas</h2>`; in the empty state `EstadoVacio`'s `<h2>` is a sibling section. Guarantees a heading inside `<main>` in every state (`rutas-protegidas.test.tsx:83,143`). |

### Screen state machine (`PantallaListas`)

Evaluated in order after the heading and the conditional notice:

1. `hogar.estado === 'error'` → banner only.
2. `hogar.estado === 'sin-hogar'` → `EstadoVacio` "Todavía no formas parte de un hogar" / "Sin hogar no se pueden crear listas." (no form).
3. `hogar.estado === 'loading'` or `!ready` → `EstadoCarga etiqueta="Cargando listas…"`.
4. `ready && listas.length === 0` → `EstadoVacio` "Todavía no tienes listas" / "Crea tu primera lista para compartirla con tu hogar." with `CrearLista` as children.
5. populated → `CrearLista` + `<ul aria-label="Listas de la compra">` of `FilaLista`.

Banner from D5 renders above the body in states 4–5 too (rename/delete failures keep the list visible). Notice: `hogar.estado === 'ready' && hogar.miembros.length < 2` → "Todavía no hay nadie más en tu hogar." / "Invita a alguien para compartir las listas."

## Data Flow

    useHogar() ─┐
                ├─ PantallaListas ── CrearLista (crear)
    useListas() ┘        │
                         └─ FilaLista (lista, renombrar, eliminar)
                               ├─ EnlaceLista ──> /listas/$listaId
                               └─ EliminarLista ── AlertDialogContent
                                                     └─ ContenidoEliminarLista ── useArticulos(listaId)

## File Changes

| File (`frontend/src/…`) | Action | Description |
|---|---|---|
| `routes/_privado/index.tsx` | Modify | Placeholder → `<PantallaListas />` |
| `modules/listas/ui/listas/pantalla-listas.tsx` | Create | Container, state machine, error copy map |
| `…/aviso-segundo-miembro.tsx` | Create | `Alert role="status"` notice |
| `…/crear-lista.tsx` | Create | Label + Input (`h-11`) + submit |
| `…/fila-lista.tsx` | Create | `<li>`: view/edit modes, "Renombrar"/"Guardar"/"Cancelar" |
| `…/enlace-lista.tsx` | Create | Seam `Link` with `@ts-expect-error` |
| `…/eliminar-lista.tsx` | Create | Trigger + controlled `AlertDialog` |
| `…/contenido-eliminar-lista.tsx` | Create | Title, count description, footer |
| `…/*.test.tsx` (7) | Create | One per component + `pantalla-listas.ruta.test.tsx` |
| `shared/ui/{input,label,alert-dialog}.tsx` | Create | shadcn CLI output |
| `app/marco-app.test.tsx` (C2 case, lines 127–145) | Modify (needs boundary amendment) | Pins the placeholder copy; under its `auth`-only mock `resolverHogar` resolves `error`, so the screen correctly shows the banner, not the empty state |

## Interfaces / Contracts

```ts
// Accessible names use visible text; aria-label keeps it as prefix (label-in-name)
FilaLista: { lista: Lista; renombrar: (id, nombre) => Promise<Resultado<void>>; eliminar: (id) => Promise<Resultado<void>> }
EnlaceLista: { lista: Pick<Lista, 'id' | 'nombre'> }   // href="/listas/<id>", className cn(buttonVariants({variant:'link'}), 'min-h-11')
ContenidoEliminarLista: { lista; eliminar; alCerrar: () => void }
// Count copy: !ready → <span role="status">Contando artículos…</span>
// 0 → "Esta lista no tiene artículos." | 1 → "Se perderá 1 artículo." | n → "Se perderán {n} artículos."
```

Seam rule: exactly one line in `enlace-lista.tsx` carries `// @ts-expect-error` (never `@ts-ignore`). Verification: `cd frontend && pnpm exec tsc --noEmit` yields zero diagnostics with the line and exactly one without it. When Group B's route merges, the same command reports TS2578 (unused directive) on that line; the second merger deletes it (#538). If Prettier splits `to`/`params` so the directive covers only one diagnostic, spread a `const destino = { to, params }` object so the single error anchors on one line.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (presentational) | `CrearLista`, `FilaLista`, `EliminarLista`, `AvisoSegundoMiembro` | Props with `vi.fn()` resolving `Resultado`; `userEvent`; assert `role="alert"` inline errors, disabled/pending, `min-h-11`/`h-11` structurally |
| Unit (hooks mocked) | `PantallaListas`, `ContenidoEliminarLista` | `vi.hoisted` + `vi.mock('@/modules/listas')` and `vi.mock('@/shared/hogar/hogar-contexto')`, per `useListas.test.tsx` |
| Router context | any test rendering `EnlaceLista` | Hand-built `createRootRoute` + memory history per file (precedent `marco-app-persistencia.test.tsx:54-80`), copied not shared |
| Integration | `pantalla-listas.ruta.test.tsx` | `marco-app.test.tsx` harness + mocks of `@/shared/hogar/hogar-repository` (`resolverHogar` ready), `@/modules/listas/application/hogar-listas` (passthrough), `@/modules/listas`; assert screen inside `main` and `href="/listas/<id>"` |

Radix dialog under jsdom: if `userEvent` refuses clicks because of `pointer-events: none` on `body`, use `userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })`.

## Threat Matrix

N/A — no shell, subprocess, VCS/PR automation, executable-file classification, or process integration; the only routing change is a static file-route component swap with no loader/params parsing.

## Migration / Rollout

No migration required. Rollback per proposal.

## Open Questions

- [ ] Boundary amendment: Group A must edit the C2 case of `frontend/src/app/marco-app.test.tsx` (no other group claims that file). Without it, `pnpm test` fails on `develop` after merge.
- [ ] Exact anchor line for the `@ts-expect-error` after Prettier (verified during apply by the tsc rule above).
