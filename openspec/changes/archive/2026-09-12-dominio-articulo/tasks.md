# Implementation Tasks: `dominio-articulo`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 160–240 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Scope Boundary

Create only `frontend/src/modules/listas/domain/articulo.ts` and `frontend/src/modules/listas/domain/articulo.test.ts`. Do not change `frontend/src/modules/listas/index.ts`, React/UI code, InsForge code, repositories, SQL, dependencies, configuration, generated artifacts, or audit/persistence behavior.

## Tasks

- [x] **RED — specify baseline article transitions and ordering in `frontend/src/modules/listas/domain/articulo.test.ts`.** Add literal `Articulo` fixtures and direct `./articulo` imports; write initially failing Vitest cases for the exact `Articulo` shape, `marcarArticuloComprado(articulo, boughtAt, boughtBy)`, `desmarcarArticuloComprado(articulo)`, and `ordenarArticulosPorIncorporacion(articulos)`. Assert marking and unmarking return distinct objects, preserve every non-purchase field and their inputs, use the exact supplied/null purchase values, and that mixed pending/purchased articles remain present with pending first and ascending `createdAt` within each group. Run `cd frontend && pnpm test -- src/modules/listas/domain/articulo.test.ts` and record the expected RED failure before creating the module; rollback by removing only this new test file. <!-- sdd-owner: implementation -->
- [x] **GREEN — implement the minimal pure domain API in `frontend/src/modules/listas/domain/articulo.ts`.** Export `Articulo` with all eleven specified fields plus the three exact signatures; implement marking and unmarking as shallow copied objects with only coherent purchase-field overrides; implement ordering as a copied array sorted pending-before-purchased and then by `Date.parse(createdAt)` ascending. Preserve equal-comparison input order, article references, membership, duplicate occurrences, and all caller-supplied audit data; introduce no validation, generated values, React, InsForge, database, or external imports. Run `cd frontend && pnpm test -- src/modules/listas/domain/articulo.test.ts` until the RED contract passes; rollback by deleting only the two new article-domain files. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE — extend `frontend/src/modules/listas/domain/articulo.test.ts` with edge and invariance cases, then make only the required minimal correction in `articulo.ts`.** Test repeated marking/unmarking and a mark→unmark round trip, equal instants in both purchase groups retaining input order, equivalent and offset-form timestamps (including `2026-02-03T10:00:00+02:00` before `2026-02-03T09:00:00Z`) sorting by instant rather than lexical text, duplicate article occurrences, and fresh/non-mutating empty and singleton arrays. Snapshot source arrays and articles to prove no mutation. Run `cd frontend && pnpm test -- src/modules/listas/domain/articulo.test.ts` after adding tests; if an edge fails, correct only the transition/sort logic needed and rerun. Roll back any correction that broadens the specified domain boundary. <!-- sdd-owner: implementation -->
- [x] **REFACTOR — simplify the new article domain implementation and tests without changing the contract.** Keep direct local imports, typed reusable literal-fixture helpers, and clear assertions of freshness and immutability; retain only the `Articulo` type and three specified exports in `articulo.ts`. Confirm the module is synchronous pure TypeScript and neither file needs rendering, mocks, clocks, authentication, persistence, or framework/service imports. Run `cd frontend && pnpm test -- src/modules/listas/domain/articulo.test.ts`; rollback any cleanup that changes an exported signature, ordering stability, or purchase-metadata coherence. <!-- sdd-owner: implementation -->
- [x] **Verify the bounded delivery from `frontend`.** Run `cd frontend && pnpm test -- src/modules/listas/domain/articulo.test.ts`, `cd frontend && pnpm test`, and `cd frontend && pnpm exec tsc --noEmit`; inspect the final diff to confirm only `src/modules/listas/domain/articulo.ts` and `src/modules/listas/domain/articulo.test.ts` were added and all purchase/order behavior remains isolated. If the implementation diff approaches 400 changed lines or scope expands, stop before delivery for the required `ask-on-risk` decision; otherwise revert only failed or leaked changes as needed. <!-- sdd-owner: implementation -->

## Delivery Notes

The planned two-file pure-domain slice is forecast below the 400-line review budget, so it remains a single PR with no selected chain strategy. Reassess the actual implementation diff before delivery; `ask-on-risk` requires a human decision if the budget becomes at risk.
