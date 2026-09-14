# Implementation Tasks: `dominio-lista`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 180–260 |
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

Only create `frontend/src/modules/listas/domain/lista.test.ts` and `frontend/src/modules/listas/domain/lista.ts`. Do not modify task 039 work, barrels, routes, UI, React, InsForge code, mocks, dependencies, generated artifacts, or configuration.

## Tasks

- [x] **RED — specify the public contract in `frontend/src/modules/listas/domain/lista.test.ts`.** Add colocated Vitest tests importing `./lista` that define literal `Lista` metadata and initially fail for the absent factory. Assert the exact discriminated result shapes; preservation of all seven fields, including exact `Z` and offset timestamps; a newly allocated output list; and no mutation of the supplied input. <!-- sdd-owner: implementation -->
- [x] **GREEN — create `frontend/src/modules/listas/domain/lista.ts` with the minimal public API.** Export exactly `Lista`, `ErrorNombreLista`, `ResultadoCrearLista`, and `crearLista(datos: Lista)`. Construct a new seven-field list, trim `nombre` once, return `nombre-vacio` for normalized emptiness, and return success without generating, parsing, changing, or validating the other six strings. Run `pnpm test -- src/modules/listas/domain/lista.test.ts` from `frontend` to make the RED contract pass. Roll back by deleting only the two planned domain files. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE — extend `frontend/src/modules/listas/domain/lista.test.ts` with boundary and normalization cases before making any required minimal correction in `lista.ts`.** Cover normalized lengths 1 and 80 as successes and 81 as `nombre-demasiado-largo`, with astral characters counted as one code point and combining marks counted separately. Cover empty and whitespace-only values without throws; trim spaces, tabs, newlines, NBSP, and BOM before validation and output; preserve internal mixed/consecutive whitespace; and allow repeated calls with duplicate normalized names. Implement code-point counting with `Array.from(nombre).length` only as needed to satisfy these cases, then rerun the focused pnpm test command. <!-- sdd-owner: implementation -->
- [x] **REFACTOR — simplify the two new domain files without changing their observable contract.** Keep only the four required exports, use a local `./lista` import and type-only imports where appropriate, remove duplicated fixture/assertion setup, and confirm the module remains synchronous pure TypeScript with no framework, persistence, mock, or external-service imports. Re-run `pnpm test -- src/modules/listas/domain/lista.test.ts` from `frontend`; rollback any cleanup that alters a specified result shape or normalization behavior. <!-- sdd-owner: implementation -->
- [x] **Verify the bounded delivery from `frontend`.** Run `pnpm test -- src/modules/listas/domain/lista.test.ts`, `pnpm test`, and `pnpm exec tsc --noEmit`; inspect the final diff to confirm only `src/modules/listas/domain/lista.ts` and `src/modules/listas/domain/lista.test.ts` were created and no generated or unrelated files changed. If verification reveals scope leakage, revert only the leaked changes and retain the two-file domain work. <!-- sdd-owner: implementation -->

## Delivery Notes

The pnpm lockfile and frontend README establish pnpm as the canonical package manager. This work is forecast below the 400-line review budget, so it is planned as one PR; no chain strategy is selected unless implementation materially exceeds the forecast.
