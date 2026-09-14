# Design: Pure list creation contract

## Technical Approach

Implement task 040 as a synchronous, dependency-free TypeScript module, following [the proposal](proposal.md) and [the specification](specs/lista-domain/spec.md). Only the two domain files listed below belong to later implementation. This phase creates this design only.

The existing `listas/domain` contains only `.gitkeep`. Vitest already discovers colocated tests, enables globals, and resolves TypeScript aliases. TypeScript targets ES2022 with strict checking. No configuration or dependency changes are needed; `openspec/config.yaml` is absent.

## Architecture Decisions

| Option | Tradeoff | Decision and rationale |
|---|---|---|
| One object argument typed as `Lista` versus a separate input DTO | The same shape describes raw and normalized names; a DTO duplicates seven fields | Use `crearLista(datos: Lista): ResultadoCrearLista`; normalization is a factory guarantee, not a branded type |
| Result union versus exceptions | Callers explicitly narrow `ok` | Use the specified union so ordinary invalid names never throw |
| Native `trim()` and `Array.from(nombre).length` versus regex, UTF-16 length, or grapheme segmentation | Array conversion allocates linearly in input size | Prefer native, transparent ECMAScript trimming and code-point counting for this tiny module |
| Explicit field construction versus object spread | Slightly more repetition | Construct exactly seven fields in a new object; do not accidentally carry runtime extras or mutate input |
| Caller-supplied metadata versus parsing or generation | ISO correctness remains a caller responsibility | Preserve metadata verbatim; extra validation would violate the deliberately limited contract |

## Interfaces / Contracts

Export exactly these four declarations from `domain/lista.ts`:

```ts
export type Lista = {
  id: string
  householdId: string
  nombre: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type ErrorNombreLista =
  | 'nombre-vacio'
  | 'nombre-demasiado-largo'

export type ResultadoCrearLista =
  | { ok: true; lista: Lista }
  | { ok: false; error: ErrorNombreLista }

export function crearLista(datos: Lista): ResultadoCrearLista
```

The signature above is a design declaration, not an overload requirement. Implement a normal exported function with that signature. No additional public constants, helpers, classes, schemas, or input types are needed.

Timestamps represent ISO 8601 date-time strings with `Z` or an offset. The factory neither parses nor validates them; it preserves their exact spelling, fractional precision, and offset. Identity and audit-user strings receive no validation. Runtime non-string inputs are outside this typed API; do not introduce coercion or additional error variants.

The module barrel remains unchanged: exports here are domain-module exports, not application-wide re-exports. Future consumers can address barrel exposure in their own tasks.

## Data Flow

`supplied Lista → trim nombre → reject empty → reject >80 code points → construct Lista → success`

1. Compute `nombre = datos.nombre.trim()` once.
2. If empty, return `{ ok: false, error: 'nombre-vacio' }`.
3. If `Array.from(nombre).length > 80`, return the other failure variant.
4. Return `{ ok: true, lista }`, copying six metadata strings and the normalized name.

Do not collapse internal whitespace, normalize Unicode, inspect other lists, read clocks, generate IDs, or retain state. Combining marks count separately; astral characters count once. Repeated calls with duplicate normalized names succeed independently.

## File Changes

| File | Action | Description |
|---|---|---|
| `frontend/src/modules/listas/domain/lista.ts` | Create | Types and pure factory |
| `frontend/src/modules/listas/domain/lista.test.ts` | Create | Colocated unit tests |

No React, InsForge, mocks, UI, routing, architecture documentation, generated routes, barrel edits, or task 039 changes.

## Testing Strategy

Use RED–GREEN–REFACTOR, existing Vitest globals, and a local `./lista` import with type-only imports where needed. Use literal metadata fixtures, not services or dates generated at runtime.

| Coverage | Assertions |
|---|---|
| Contract | Narrow on `ok`; assert exact success/failure shapes and all fields |
| Empty | Empty string and whitespace-only inputs fail without throwing |
| Boundaries | ASCII lengths 1/80 succeed, 81 fails |
| Unicode | Astral lengths 80/81; combining sequences distinguish code points from graphemes |
| Normalization | Padded 80 succeeds; tabs, newlines, NBSP and BOM trim; internal mixed whitespace survives |
| Preservation | Offset and `Z` timestamps unchanged; input unchanged and output newly allocated |
| Independence | Duplicate normalized names succeed; repeated calls return equal values |

Run from `frontend`: `npm test -- src/modules/listas/domain/lista.test.ts`, then `npm test` and `npx tsc --noEmit`. No tests were executed during design. Existing shared jsdom setup is infrastructure, not a domain dependency. Inspect for incidental generated-file changes without overwriting unrelated work.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Deliver domain and tests together; no runtime wiring or feature flag. Roll back only those two files. Database length and PostgreSQL `btrim` semantics differ; task 043 owns legacy-row mapping decisions, not this factory.

## Open Questions

None. Ready for task planning.
