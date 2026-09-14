# Exploration: `dominio-articulo`

## Scope and status

- **Task:** `docs/tareas/041-dominio-articulo.md`
- **Target implementation files:** `frontend/src/modules/listas/domain/articulo.ts` and colocated `articulo.test.ts`
- **Status:** ready for proposal/spec/design/tasks; no implementation or tests were changed or run during exploration.
- **Skill resolution:** none (no phase-skill paths were injected).

## Confirmed evidence

1. `frontend/src/modules/listas/domain/lista.ts` establishes the immediate convention: Spanish camelCase domain fields, exported type plus pure synchronous functions, explicit field construction, no React/InsForge imports, and colocated Vitest tests.
2. `shopping_items` stores `id`, `list_id`, `household_id`, `content`, `is_bought`, `bought_by`, `bought_at`, and the four audit columns. The database constraint requires an unpurchased row to have both purchase fields `NULL`, and a purchased row to have both non-`NULL`.
3. Product requirements establish that purchased articles remain visible, are grouped after pending articles, can be unmarked, and have no manually managed position. “Order of incorporation” therefore derives from `created_at` / the domain `createdAt` value.
4. `docs/03-Arquitectura.md` explicitly assigns marking, unmarking, and ordering to `domain/articulo.ts`, not a UI component or SQL query. Task 043 will map raw PostgREST rows to the domain type; task 048 will consume the domain API.
5. The current module public barrel (`frontend/src/modules/listas/index.ts`) is intentionally empty, so this change must not broaden it.

## Recommended contract for the next SDD phases

Use the neighbouring `Lista` naming convention to define a Spanish domain shape such as:

```ts
type Articulo = {
  id: string
  listaId: string
  householdId: string
  contenido: string
  comprado: boolean
  boughtAt: string | null
  boughtBy: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}
```

The exact exported function names are not specified by task 041 and should be fixed in the spec. The recommended API is a pure clone-returning mark function that receives the purchaser ID and purchase timestamp explicitly, a clone-returning unmark function, and a clone-returning ordering function. Supplying the ID and timestamp as arguments keeps marking deterministic and avoids a hidden clock or authentication dependency.

Required state transitions:

| Operation | `comprado` / `is_bought` | `boughtAt` | `boughtBy` |
|---|---:|---|---|
| Mark | `true` | supplied non-null timestamp | supplied non-null purchaser ID |
| Unmark | `false` | `null` | `null` |

Do not change identity, list/household, content, creation, or update audit values in these domain transitions. The database trigger owns update-audit writes. The mapping task should translate the selected Spanish domain field names to/from the snake_case database columns.

The ordering function should retain every input article, return a new array without mutating the caller’s array, place `comprado: false` before `comprado: true`, and order each state group by `createdAt` ascending. Equal incorporation times should preserve input order, which gives deterministic behavior without inventing a secondary business ordering rule. The spec should state that the timestamps are valid ISO date-times supplied by persistence; ordering must compare incorporation instants rather than rely on lexical ordering that can misorder offset-form timestamps.

## Tests to write first

1. Marking produces a new purchased article with exactly the supplied purchaser and timestamp, preserves all other fields, and does not mutate its input.
2. Unmarking produces a new article with `comprado: false`, `boughtAt: null`, and `boughtBy: null`, including when the input was purchased; this exact shape satisfies `comprado_coherente`.
3. Marking and then unmarking retains the article and its non-purchase metadata while clearing both purchase fields.
4. Ordering returns pending articles before purchased articles, orders dates ascending within both groups, retains purchased articles rather than filtering them out, and does not mutate the source array or its elements.
5. Ordering with equal `createdAt` values preserves original relative order; an offset-timestamp case confirms chronological incorporation rather than string ordering.

Use literal fixtures and direct `./articulo` imports. No rendering, mocks, React, InsForge client, database access, generated dates, or test setup changes are needed.

## Scope and delivery assessment

- **In scope:** the two article domain files and their pure unit tests.
- **Out of scope:** content validation/creation, editing, deletion, purchase clearing, repository mapping, SQL, hooks, UI, realtime, module-barrel changes, dependencies, and configuration.
- **Estimated change:** 150–230 lines across the module and tests.
- **Review budget:** low risk against the 400-line limit; no delivery decision is required under `ask-on-risk`.
- **Verification for apply:** `cd frontend && pnpm test -- src/modules/listas/domain/articulo.test.ts`, then `cd frontend && pnpm test` and `cd frontend && pnpm exec tsc --noEmit`.

## Repository note

The supplied context identifies the prior archive as `openspec/archive/2026-09-12-dominio-lista/`, but that path does not exist in this workspace. The accessible archive is `openspec/changes/archive/2026-09-12-dominio-lista/`; its completed list-domain artifacts were used as the local convention reference.
