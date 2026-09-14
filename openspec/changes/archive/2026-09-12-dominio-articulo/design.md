# Design: Article purchase state and incorporation order

## Technical Approach

Add a pure TypeScript domain module and colocated Vitest tests, following `lista.ts` and `lista.test.ts`. Implement task 041 and the proposal without React, InsForge, persistence, or UI dependencies. Inputs were read directly from `proposal.md`, `explore.md`, and `docs/tareas/041-dominio-articulo.md`. The completed `specs/articulo-domain/spec.md` was read directly and is authoritative for the API and behavior below.

## Architecture Decisions

| Option | Tradeoff | Decision and rationale |
|---|---|---|
| Explicit purchaser and timestamp vs ambient auth/clock | Caller supplies context | Explicit arguments ensure deterministic, independently testable transitions. |
| Copy article and override purchase fields vs reconstruct every field | Spread differs from `crearLista`'s normalization constructor | Copy with purchase overrides: this transition must preserve every other value, including untrimmed content and audit metadata. |
| Copy array and stable-sort vs mutate/filter | One shallow array allocation | Copy before sorting; retain every occurrence and reuse article references without modifying them. |
| Numeric instants vs lexical timestamps | Dates require parsing | Compare `Date.parse(createdAt)` values so timezone offsets cannot reverse chronology. |
| Native stable sort vs index decoration | Relies on modern ECMAScript guarantee | ES2022 is already configured; return zero for equal instants, avoiding an invented ID tie-breaker. |
| Plain domain shape vs validation/result wrappers | Caller must provide valid data | No new validation or error union: this slice transforms trusted domain values only. |

## Interfaces / Contracts

Export `Articulo` with these fields:

| Fields | Type |
|---|---|
| `id`, `listaId`, `householdId`, `contenido` | `string` |
| `comprado` | `boolean` |
| `boughtAt`, `boughtBy` | `string \| null` |
| `createdAt`, `createdBy`, `updatedAt`, `updatedBy` | `string` |

Specification-defined synchronous exports:

- `marcarArticuloComprado(articulo: Articulo, boughtAt: string, boughtBy: string): Articulo`
- `desmarcarArticuloComprado(articulo: Articulo): Articulo`
- `ordenarArticulosPorIncorporacion(articulos: readonly Articulo[]): Articulo[]`

Marking returns a fresh object with `comprado: true` and exactly the supplied purchase values, even if already purchased. Unmarking always returns a fresh object with `comprado: false` and both purchase fields null, including an already-pending input. Neither operation changes any non-purchase field or mutates its input. A mark/unmark round trip restores a coherent pending article's values.

Ordering first compares purchase state (pending before purchased), then incorporation instants ascending within each group. Equal instants within a group preserve input order, including differently formatted equivalent timestamps. Empty and singleton inputs also return fresh arrays. Membership, duplicates, and article references are retained.

Preconditions: timestamp strings are valid ISO date-times with timezone information, and marking receives a valid purchaser ID. No normalization, runtime validation, clock access, authentication, or invalid-date fallback is introduced. Parsing supplied timestamps is not reading a clock. Update-audit writes remain outside this domain.

## Data Flow

- Caller-owned article + timestamp + purchaser → mark → new purchased article.
- Caller-owned article → unmark → new pending article with cleared purchase metadata.
- Caller-owned array → shallow copy → stable state/instant sort → new array containing all original articles.

Future mapping (task 043) and UI consumption (task 048) remain unchanged.

## File Changes

| File | Action | Purpose |
|---|---|---|
| `frontend/src/modules/listas/domain/articulo.test.ts` | Create first | Literal fixtures and behavioral tests |
| `frontend/src/modules/listas/domain/articulo.ts` | Create after RED | Type and three pure functions |

No barrel, repository, database, UI, dependency, or configuration changes.

## Testing Strategy

Use direct `./articulo` imports and existing Vitest globals, without rendering or mocks.

1. RED: test exact mark/unmark results, fresh object identity, unchanged inputs, repeated transitions, round trip, and preservation of content/audit values.
2. RED: test mixed states, chronology in both groups, retained membership/duplicates, unchanged elements/source array, and fresh empty/singleton results.
3. RED: include `2026-02-03T10:00:00+02:00` before `2026-02-03T09:00:00Z`; test stability for equal strings and equivalent offset instants in both groups.
4. GREEN: implement only enough behavior for the failing tests. REFACTOR: simplify while keeping all tests green.

Record RED evidence before implementation. Then run from `frontend/`: `pnpm test -- src/modules/listas/domain/articulo.test.ts`, `pnpm test`, and `pnpm exec tsc --noEmit`. Integration/E2E tests are unnecessary for this pure boundary. No tests were executed during design.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration or feature flag required. Introduce the isolated exports after verification; rollback removes the two new files. Before apply, assess the complete authored diff including artifacts against 400 lines; `ask-on-risk` requires a delivery decision if at risk. No chaining or size exception is authorized.

## Open Questions

No blocking technical questions. Export names and signatures match the authoritative completed specification.
