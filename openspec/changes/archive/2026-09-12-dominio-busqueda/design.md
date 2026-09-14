# Design: Spanish-aware search normalization and matching

## Technical Approach

Add one pure TypeScript module and its colocated Vitest test, following `lista.ts` and `articulo.ts`: synchronous, deterministic, no React, InsForge, persistence, clock, or mocks, and no barrel change. Normalization is `trim → NFD → strip combining marks except U+0303 → NFC → lowercase`; matching is `String.prototype.includes` over two strings normalized identically. Inputs read: `proposal.md`, `research.md`, `explore.md`, and both neighbor modules. `specs/busqueda-domain/spec.md` does not exist at design time, so the names below are design-proposed and yield verbatim to the spec if it fixes different ones (see Open Questions).

## Architecture Decisions

| Option | Tradeoff | Decision and rationale |
|---|---|---|
| `normalize('NFD')` + range strip + `includes` vs an explicit accented-vowel substitution map | The map is `ñ`-safe by construction; NFD needs one auditable exclusion | NFD: it is the standard idiom, needs no enumerated character table, and the exclusion is a single reviewable range boundary backed by a named regression test. The map remains the documented fallback, not the choice. |
| `Intl.Collator` / `localeCompare` with `sensitivity: 'base'` | Platform collation, but whole-string only | Rejected. Decisive reason: there is no locale-sensitive substring primitive (tc39/ecma402#506), and this feature is substring search. Correcting the record: research measured `'ñ'.localeCompare('n','es',{sensitivity:'base'})` as `1` on Node v26.8.1 / ICU 78.3, so it would **not** have folded `ñ`; the exploration's suspicion was backwards. Rejection rests solely on the missing substring primitive. |
| Exclude U+0303 vs strip the whole U+0300–U+036F block | One gap in the range | Exclude. UCD gives `ñ`/`Ñ` the canonical decomposition `006E 0303` / `004E 0303`, so a blanket strip yields `piña` → `pina`, reproduced in research. |
| Re-compose with `normalize('NFC')` vs leave the decomposed form | One extra normalization pass per call | Re-compose. This is **required for correctness, not defensive** — see Interfaces. |
| Two exports (primitive + predicate) vs a normalization primitive only | Slightly larger surface | Two. The predicate owns substring checking and empty-query semantics so task 054 calls the rule instead of re-implementing it. |
| Trim inside the primitive vs only inside the predicate | Primitive does two jobs | Trim inside the primitive, as `crearLista` trims names: both sides get identical treatment and the predicate's empty check is a plain `=== ''`. |
| Empty/whitespace query matches everything vs matches nothing | — | Matches everything: "no filter applied", which is what 054's empty search box needs. |

## Interfaces / Contracts

```ts
const MARCAS_DIACRITICAS_PLEGABLES = /[\u{0300}-\u{0302}\u{0304}-\u{036F}]/gu

export function normalizarParaBusqueda(texto: string): string
export function coincideConBusqueda(contenido: string, consulta: string): boolean
```

The class covers U+0300–U+0302, skips U+0303, then resumes at U+0304 through U+036F: the whole Combining Diacritical Marks block minus exactly one code point. Rationale sentence, the one comment this otherwise comment-free module warrants: *U+0303 is excluded because `ñ`/`Ñ` decompose canonically to `n`/`N` + U+0303, so stripping it would rewrite a distinct Spanish letter as `n` and collide `piña` with `pina`.*

**Recomposition is load-bearing.** Symmetric application alone is not enough. Without NFC, normalized `piña` is `p i n U+0303 a`, and `'piña'.includes('pin')` is `true` — a query of `pin` would match `piña`, leaking the bare `n` the requirement forbids. `normalize('NFC')` restores `ñ` as one code point, so `pin` no longer matches. The whole-word cases (`pina`, `ano`) fail correctly either way; the partial-prefix cases only fail correctly after recomposition.

**Order of operations** is `trim → NFD → strip → NFC → lowercase`, and each adjacency is forced: the strip has nothing to remove before NFD (a precomposed `á` holds no U+0301), and NFC would immediately recompose what the strip removed, so the strip must sit strictly between them. `trim` is free to move — neither normalization form nor the strip creates or consumes edge whitespace — and is placed first to short-circuit empty queries. Lowercasing is last and safe: U+0303 has no case mapping, and the one common case mapping that emits a combining mark, U+0130, is already canonically decomposed by the NFD step and its U+0307 stripped.

`normalizarParaBusqueda` returns a comparison key, not display text. `coincideConBusqueda` normalizes both arguments, returns `true` when the normalized query is `''`, and otherwise returns `contenidoNormalizado.includes(consultaNormalizada)`. Both functions are total over `string`, never throw, allocate no shared state, and mutate nothing.

## Data Flow

    consulta  ─trim─NFD─strip─NFC─lower─→ clave ──┐
                                                  ├─ '' ? true : includes → boolean
    contenido ─trim─NFD─strip─NFC─lower─→ clave ──┘

Search text stays view state: no query key, no fetch, no ordering. Task 054 composes this predicate with `ordenarArticulosPorIncorporacion`.

## File Changes

| File | Action | Description |
|---|---|---|
| `frontend/src/modules/listas/domain/busqueda.test.ts` | Create first | Colocated tests, literal fixtures |
| `frontend/src/modules/listas/domain/busqueda.ts` | Create after RED | Regex constant and two pure functions |

No barrel, dependency, configuration, UI, route, or neighbor-module changes.

## Testing Strategy

RED–GREEN–REFACTOR with existing Vitest globals and a direct `./busqueda` import. English test prose, Spanish data literals, no rendering or mocks.

| Coverage | Named cases |
|---|---|
| Accents | `azucar`, `AZUCAR`, `Azúcar`, `AZÚCAR` all match `Azúcar`; accented query `azúcar` matches unaccented `Azucar` |
| Vowels and diaeresis | `á é í ó ú ü` and uppercase fold to plain vowels; `pinguino` matches `Pingüino` |
| `ñ` regression | `pina` does **not** match `piña`; `ano` does not match `año` |
| Recomposition regression | `pin` does not match `piña`; `an` does not match `año` (fails without NFC) |
| `ñ` still matches itself | `ñ` and `Ñ` match `piña`; `Ñ` matches `Ñoquis` |
| Substring | `integral` matches `Pan integral`; `leche` does not match `Pan integral` |
| Empty and whitespace | `''`, `'   '`, `'\t\n'` match any content including `''`; nothing throws |
| Primitive | `normalizarParaBusqueda('')` is `''`; `'  Azúcar  '` is `'azucar'`; repeated calls are equal |
| Purity | Astral characters survive normalization; results are deterministic across calls |

Then run from `frontend/`: `pnpm test -- src/modules/listas/domain/busqueda.test.ts`, `pnpm test`, `pnpm exec tsc --noEmit`. Integration and E2E add nothing at this pure boundary. No tests were executed during design.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration, feature flag, or phased rollout. Ship both files together; rollback deletes them. No persisted data, schema, route, or live UI is touched and there are no consumers yet. Delivery is `single-pr`; no chaining or size exception is authorized.

## Open Questions

- [x] `specs/busqueda-domain/spec.md` was absent when this design was written, so the exported names above were design-proposed. Resolved: the spec fixed `normalizarParaBusqueda(texto: string): string` and `coincideConBusqueda(contenido: string, consulta: string): boolean`, and this document was updated to use the spec's names verbatim. No behavior in this design depended on the naming.
