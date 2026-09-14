# Implementation Tasks: `dominio-busqueda`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 220–320 |
| Review budget | 800 |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | none |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: none
800-line budget risk: Low

This slice is a two-file pure-domain module comparable in shape to the archived `dominio-articulo` (160–240 lines) and `dominio-lista` (180–260 lines) precedents, but with more named regression cases (case folding, true-diacritic folding, bidirectional symmetry, whole-token `ñ` collision, partial-prefix `ñ` boundary, substring matching, empty/whitespace queries, empty-string normalization). The forecast of 220–320 lines sits well inside the cached 800-line review budget, so no chaining or size exception is needed.

## Scope Boundary

Create only `frontend/src/modules/listas/domain/busqueda.ts` and `frontend/src/modules/listas/domain/busqueda.test.ts`. Do not modify `frontend/src/modules/listas/index.ts`, `lista.ts`, `articulo.ts`, any React/UI code, any hook, any route, InsForge code, repositories, mocks, dependencies, configuration, or generated artifacts.

## Tasks

- [x] **RED — specify the public search contract and its core Spanish-aware matching rules in `frontend/src/modules/listas/domain/busqueda.test.ts`.** Add a colocated Vitest test file with direct `./busqueda` imports and literal string fixtures (no rendering, no mocks) that initially fails against the not-yet-created module. Cover, each as an explicitly named case:
  - **Exports exist with the documented shapes** — `normalizarParaBusqueda` returns a string, `coincideConBusqueda` returns a boolean.
  - **Case folding** — `coincideConBusqueda("Azúcar", "AZUCAR")`, `coincideConBusqueda("Azúcar", "Azucar")`, and `coincideConBusqueda("Azúcar", "azucar")` all return `true`.
  - **True-diacritic folding** — `normalizarParaBusqueda("áéíóúÁÉÍÓÚü Ü")` equals `"aeiouaeiouu u"` (no accented vowel survives).
  - **Bidirectional symmetry** — an unaccented query matches accented content (`coincideConBusqueda("Azúcar", "azucar")` is `true`) AND an accented query matches unaccented content (`coincideConBusqueda("azucar", "azúcar")` is `true`).
  - **`ñ` whole-token collision regression** — `coincideConBusqueda("piña", "pina")`, `coincideConBusqueda("año", "ano")`, and `coincideConBusqueda("caña", "cana")` all return `false`.
  - **Substring matching in multi-word content** — `coincideConBusqueda("Pan integral", "integral")` and `coincideConBusqueda("Pan integral", "pan")` return `true`; `coincideConBusqueda("Pan integral", "leche")` returns `false`.
  - **Empty and whitespace-only queries match every content** — `coincideConBusqueda("Azúcar", "")`, `coincideConBusqueda("Pan integral", "   ")`, and `coincideConBusqueda("", "")` all return `true`.
  - **Normalizing the empty string never throws** — `normalizarParaBusqueda("")` returns `""` and the call does not throw.

  Run `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts` and record the expected RED failure (module does not exist yet) before creating `busqueda.ts`. Rollback by removing only this new test file. <!-- sdd-owner: implementation -->

- [x] **GREEN — implement the minimal pure domain module in `frontend/src/modules/listas/domain/busqueda.ts` to satisfy the RED contract.** Export exactly `normalizarParaBusqueda(texto: string): string` and `coincideConBusqueda(contenido: string, consulta: string): boolean`, applying the design's fixed pipeline order `trim → NFD → strip combining marks in U+0300–U+036F excluding U+0303 → NFC → lowercase`, with `coincideConBusqueda` normalizing both arguments identically and returning `true` whenever the normalized `consulta` is `''`, otherwise `contenidoNormalizado.includes(consultaNormalizada)`. Introduce no React, InsForge, persistence, mock, clock, or other external import; mutate neither argument; keep both functions synchronous and total over `string`. Run `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts` until the RED contract passes. Rollback by deleting only the two new search-domain files. <!-- sdd-owner: implementation -->

- [x] **TRIANGULATE — extend `frontend/src/modules/listas/domain/busqueda.test.ts` with the partial-prefix regression and remaining edge/invariance cases, then make only the required minimal correction in `busqueda.ts`.** Add, each as an explicitly named case:
  - **`ñ` partial-prefix boundary regression (a separate failure mode from the whole-token collision above)** — `coincideConBusqueda("piña", "pin")` and `coincideConBusqueda("año", "an")` both return `false`. This is the case that fails when the normalization pipeline strips combining marks without a subsequent NFC recomposition, because the decomposed `piña` (`p i n U+0303 a`) would let `.includes("pin")` return `true`; assert this explicitly so a future regression that drops the NFC step is caught.
  - **`ñ`/`Ñ` still match themselves regardless of case** — `coincideConBusqueda("Piña", "PIÑA")` returns `true`, and a case such as `coincideConBusqueda("Ñoquis", "ñoquis")` returns `true`.
  - **Diaeresis and additional true-diacritic coverage** — a case such as `coincideConBusqueda("Pingüino", "pinguino")` returns `true`.
  - **Purity and non-mutation** — repeated calls with the same input are equal (deterministic), `normalizarParaBusqueda` does not mutate or reassign its argument, astral (surrogate-pair) characters survive normalization without throwing, and a mixed-whitespace query (`"\t\n"`) is treated as whitespace-only and matches every content.
  - **Additional whole-string vs substring boundary** — a query equal to the full normalized content still matches, confirming the substring check is not restricted to a strict subset.

  Run `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts` after adding these tests. If any edge case fails, correct only the regex range, pipeline ordering, or recomposition step needed to satisfy it, and rerun. Roll back any correction that broadens the module beyond the two specified exports or introduces validation, generated values, or external dependencies. <!-- sdd-owner: implementation -->

- [x] **REFACTOR — simplify the new search-domain implementation and tests without changing the observable contract.** Keep the direct local `./busqueda` import, typed reusable literal fixtures where they reduce duplication, and clear per-case assertions. Retain only the regex constant and the two specified exports in `busqueda.ts`; keep the one rationale comment documenting the U+0303 exclusion (per design) and no other comments. Confirm the module remains synchronous pure TypeScript with no React, InsForge, persistence, clock, mock, or framework import. Run `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts`; rollback any cleanup that changes an exported signature, the normalization pipeline order, the `ñ` exclusion, or empty-query semantics. <!-- sdd-owner: implementation -->

- [x] **Verify the bounded delivery from `frontend`.** Run `cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts`, `cd frontend && pnpm test`, and `cd frontend && pnpm exec tsc --noEmit`; inspect the final diff to confirm only `src/modules/listas/domain/busqueda.ts` and `src/modules/listas/domain/busqueda.test.ts` were added, the `frontend/src/modules/listas/index.ts` barrel is untouched, and no UI, hook, route, or InsForge file changed. If the implementation diff approaches the 800-line review budget or scope expands beyond the two named files, stop before delivery for a human decision; otherwise revert only failed or leaked changes as needed. <!-- sdd-owner: implementation -->

## Delivery Notes

Delivery strategy is cached as `single-pr` (no chaining, no size exception). The forecast of 220–320 changed lines sits well below the 800-line review budget, so this ships as one PR once all five tasks are GREEN. Strict TDD is active throughout: every named test case above must be written and observed failing before the corresponding implementation code is written, per the RED → GREEN → TRIANGULATE → REFACTOR ordering.
