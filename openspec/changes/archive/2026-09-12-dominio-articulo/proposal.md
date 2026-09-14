# Proposal: Article purchase state and incorporation order

## Intent

Deliver task 041 with a pure TypeScript article domain contract for marking, unmarking, and ordering shopping-list articles. Shoppers must still see what they have picked up and be able to undo mistakes; purchased articles belong at the end, not hidden. Centralizing these rules avoids inconsistent UI behavior and ensures unmarking clears the purchase metadata required by the database constraint.

## Scope

### In Scope
- Define `Articulo` following the neighboring `Lista` convention: `id`, `listaId`, `householdId`, `contenido`, `comprado`, nullable `boughtAt` and `boughtBy`, and `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Provide pure synchronous marking and unmarking functions returning new article objects without mutating their inputs.
- Mark with `comprado: true` and explicitly supplied purchaser ID and purchase timestamp; unmark with `comprado: false`, `boughtAt: null`, and `boughtBy: null`.
- Return a new ordered array containing every input article: pending first, then purchased, with each group ordered by incorporation (`createdAt`) ascending.
- Write colocated Vitest tests first, using literal fixtures and direct domain imports without rendering or mocks.

### Out of Scope
- Repositories, row mapping, application hooks, UI, realtime, SQL, authorization, or database integration.
- Article creation/content validation, editing, deletion, bulk clearing, manual position, or validation beyond the requested behavior.
- Generated identifiers, generated dates or hidden clocks, audit-field updates, module-barrel exports, dependencies, and test configuration changes.

## Capabilities

### New Capabilities
- `articulo-domain`: Article data, reversible purchase-state transitions, and non-mutating incorporation ordering.

### Modified Capabilities
- None; the existing `lista-domain` contract remains unchanged.

## Approach

Use the confirmed task and exploration handoff; product discovery belongs to the orchestrator and no additional interview is needed for this proposal. No external research was selected.

Keep the implementation in the domain layer with no React or InsForge imports. Preserve identity, list/household, content, creation metadata, and update metadata during purchase transitions; persistence owns update-audit writes. Caller-supplied purchaser and timestamp values keep marking deterministic.

Carry the exploration recommendations into spec/design: timestamps are valid ISO date-times supplied by persistence, ordering compares instants rather than raw strings, and equal incorporation instants preserve input order. Ordering must not mutate the source array or article objects. Exact exported function names and signatures will be fixed in the specification before implementation.

Follow RED–GREEN–REFACTOR with the existing Vitest setup. This proposal does not implement or execute tests.

## Affected Areas

| Path | Planned impact |
|---|---|
| `frontend/src/modules/listas/domain/articulo.ts` | New article type and pure transition/ordering functions |
| `frontend/src/modules/listas/domain/articulo.test.ts` | New focused domain tests |

Task 040 supplies the neighboring conventions. Task 043 will map database rows to this domain shape, while task 048 will consume its behavior. Neither consumer is changed here.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Unmarking leaves stale purchase metadata and violates `comprado_coherente` | Assert both purchase fields become null together with the false purchase flag |
| Purchased articles disappear or input data is mutated | Assert retained membership, fresh return values, and unchanged inputs |
| Offset-form timestamps sort incorrectly as strings | Specify chronological comparison and test an offset-form example |
| Equal dates create unstable ordering | Preserve input order for equal incorporation instants |
| Domain work grows into persistence or UI integration | Restrict implementation to the two target files and defer consumers |

Exploration estimates 150–230 implementation/test lines, below the 400 changed-line review budget. Delivery remains `ask-on-risk`; reassess the actual delivery diff including artifacts and pause for a delivery decision if the budget is at risk. No chain strategy or size exception is authorized.

## Rollback

Revert only the new article domain implementation and its tests if introduced. This slice changes no persisted data, schema, or running UI and needs no data migration or backend rollback. If consumers are introduced later, coordinate their rollback before removing the domain API.

## Success Criteria

- [ ] `Articulo` exposes identity, ownership, content, purchase state, and audit metadata using the neighboring domain naming convention.
- [ ] Marking returns a new purchased article with exactly the supplied purchaser and timestamp, preserving all other fields and the input.
- [ ] Unmarking returns a new pending article with both purchase fields null, preserving all other fields and the input.
- [ ] A mark/unmark round trip retains the article and its non-purchase metadata.
- [ ] Ordering retains purchased articles after pending ones, with ascending incorporation instants within both groups.
- [ ] Equal incorporation instants preserve input order; offset-form date-time examples sort chronologically.
- [ ] Ordering returns a new array without mutating the source array or its elements, including empty and single-article inputs.
- [ ] Tests require no rendering, mocks, database, authentication, or generated dates; domain code imports neither React nor InsForge.
- [ ] Focused article tests, the full frontend test suite, and TypeScript checking pass during implementation verification.

## Verification Plan

Run during apply/verify, not as evidence for this proposal:

```sh
cd frontend && pnpm test -- src/modules/listas/domain/articulo.test.ts
cd frontend && pnpm test
cd frontend && pnpm exec tsc --noEmit
```

## References

- Task: `docs/tareas/041-dominio-articulo.md`
- Exploration: `openspec/changes/dominio-articulo/explore.md`
- Standards: `openspec/config.yaml` and project `AGENTS.md` instructions
- Neighbor: `frontend/src/modules/listas/domain/lista.ts` and `lista.test.ts`
