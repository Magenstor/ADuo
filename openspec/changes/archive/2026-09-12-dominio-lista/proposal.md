# Proposal: List domain type and name rules

## Intent

Deliver task 040: a pure TypeScript contract for shopping lists and consistent name validation, independent of UI and persistence. This establishes the domain boundary needed by task 048 and the row mapping in task 043.

## Scope

### In Scope
- Define `Lista` with `id`, `householdId`, `nombre`, `createdAt`, `createdBy`, `updatedAt`, and `updatedBy`.
- Provide a pure factory returning a discriminated Result union for success or validation failure, without throwing for invalid names.
- Trim leading/trailing whitespace before validating and returning the name; require a non-empty normalized name of at most 80 characters.
- Write focused unit tests first, without rendering, mocks, React, or InsForge.

### Out of Scope
- Name uniqueness, internal-whitespace rewriting, or additional business validation.
- Repository mapping, CRUD, hooks, UI, routing, realtime, authorization, and database migrations.
- Changes to task 039 work, generated routes, shell/hogar UI, architecture documentation, or dependencies.

## Capabilities

### New Capabilities
- `lista-domain`: Full list domain data and Result-based creation with normalized, bounded names.

### Modified Capabilities
- None; no existing OpenSpec specs are present.

## Approach

Use the confirmed product handoff; no further discovery round is required. Keep validation synchronous and deterministic in `domain/lista.ts`. Preserve supplied identity, household, and audit data; do not generate identifiers or timestamps. Keep internal spaces unchanged and permit duplicate names.

Follow RED–GREEN–REFACTOR using existing Vitest infrastructure. Specify exported factory/error names, timestamp representation, and Unicode length-counting semantics in spec/design before implementation; these technical details are not additional confirmed product decisions.

## Affected Areas

| Path | Planned impact |
|---|---|
| `frontend/src/modules/listas/domain/lista.ts` | New type and factory |
| `frontend/src/modules/listas/domain/lista.test.ts` | New pure unit tests |

## Risks

| Risk | Mitigation |
|---|---|
| Database permits names longer than 80; PostgreSQL `btrim` differs from JavaScript trimming | Document domain/database mismatch; defer legacy-row handling to task 043, without migration here |
| Unicode length or timestamp representation becomes implicit | Specify semantics and boundary examples before implementation |
| Unrelated task 039 changes become mixed in | Restrict implementation to the two domain files |

## Rollback Plan

Revert only task 040 domain files and tests. No persisted data, backend schema, or running UI changes require rollback.

## Dependencies

- Tasks 031 (Vitest) and 032 (folder skeleton).
- Task 043 consumes the domain contract; task 048 is blocked by task 040.

## Success Criteria

- [ ] Result success exposes all seven fields and the trimmed name.
- [ ] Empty and whitespace-only names return validation failure without throwing.
- [ ] Normalized lengths 1 and 80 succeed; 81 fails.
- [ ] Trimming precedes length validation; internal spaces and metadata remain unchanged.
- [ ] Tests pass without rendering or mocks; domain imports no React or InsForge.
