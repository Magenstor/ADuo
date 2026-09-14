# Proposal: Spanish-aware search normalization and matching

## Intent

Deliver task 042: a pure TypeScript text-search contract for the `listas` domain. In Spanish, ignoring case and accents is not a nicety — typing `azucar` must find `Azúcar`, or the search field is unusable. Task 054 explicitly delegates this rule to the domain, so the rule must live in one place and be correct standalone before any UI consumes it. No search or normalization code exists anywhere in `frontend/src` today; this is greenfield.

## Scope

### In Scope
- A text-normalization primitive that folds case and true diacritics (`á é í ó ú ü` and uppercase) to their plain letters.
- A matching predicate that owns the substring check (`content contains query`) and the empty/whitespace-query semantics, so task 054 cannot re-implement or diverge from the rule.
- Preserve `ñ`/`Ñ` as distinct letters: they MUST NEVER fold to `n`/`N`.
- Normalization applied identically to both content and query, so matching is symmetric.
- Colocated Vitest tests written first, with literal fixtures, no rendering and no mocks.

### Out of Scope
- Any UI, hook, route, InsForge, or TanStack Query work, including task 054 itself.
- Ordering and pending-before-purchased grouping; that stays in `articulo.ts` (task 041) and is composed by 054.
- The `frontend/src/modules/listas/index.ts` barrel (tasks 040 and 041 did not touch it).
- General multilingual diacritic handling beyond the Spanish alphabet.

## Capabilities

### New Capabilities
- `busqueda-domain`: case- and accent-insensitive Spanish text normalization plus substring matching, with `ñ` preserved.

### Modified Capabilities
- None; `lista-domain` and `articulo-domain` are unchanged.

## Approach

Confirmed handoff; no further discovery is required and the research lane is `done`.

Normalize with `String.prototype.normalize('NFD')`, strip Unicode combining marks in U+0300–U+036F while explicitly **excluding U+0303 COMBINING TILDE**, then lowercase. Match with plain `String.prototype.includes` over both normalized strings.

The U+0303 exclusion is required, not stylistic: the Unicode Character Database gives `ñ`/`Ñ` the canonical decomposition `006E 0303` / `004E 0303`, so a blanket range strip yields `piña` → `pina` and `año` → `ano`. Research reproduced both the trap and the fix on Node v26.8.1 / ICU 78.3.

`Intl.Collator`/`localeCompare` is rejected: it has no substring primitive (confirmed by tc39/ecma402#506), which this feature requires. An explicit accented-vowel substitution map remains an acceptable fallback if design finds a concrete reason; NFD-with-exclusion is the decided direction. The chosen approach operates at code-point level and depends on no ICU/CLDR data.

An empty or whitespace-only query matches every content — "no filter applied" — which is what task 054's empty search box requires. Trim the query as `crearLista` trims names.

Exact exported names follow the neighbors' Spanish naming (precedent: 040 and 041 deferred names to spec). Follow RED–GREEN–REFACTOR with the existing Vitest setup; this proposal executes nothing.

## Affected Areas

| Path | Planned impact |
|---|---|
| `frontend/src/modules/listas/domain/busqueda.ts` | New pure normalization and matching functions |
| `frontend/src/modules/listas/domain/busqueda.test.ts` | New focused domain tests |

Task 054 is the only known consumer and is not changed here.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| A generic combining-mark strip silently folds `ñ` → `n`, colliding `año`/`ano` and `piña`/`pina` | High without a guard | Name the preservation as a spec requirement with dedicated `ñ` tests, not an incidental regex detail |
| Normalization applied to only one side makes matching asymmetric | Medium | Require and test both directions: unaccented query against accented content and the reverse |
| Empty-query semantics get re-decided in the UI and diverge | Medium | The predicate owns the rule; 054 calls it rather than reimplementing |
| Scope drifts into ordering, filtering pipelines, or query keys | Low | Restrict implementation to the two target files; search is view state, never a query key |

Exploration estimates work well under the 800-line review budget. Delivery is `single-pr`; no chaining or size exception is authorized.

## Rollback

Revert the two new files. This slice touches no persisted data, schema, route, or running UI, and has no consumers yet, so no coordination or migration is needed.

## Success Criteria

- [ ] `azucar`, `AZUCAR`, and `Azúcar` all match content `Azúcar`; an accented query matches unaccented content.
- [ ] `á é í ó ú ü` and their uppercase forms fold to plain vowels.
- [ ] `ñ`/`Ñ` survive normalization; `piña` does not match query `pina`, and `año` does not match `ano`.
- [ ] A query fragment matches mid-content (`integral` matches `Pan integral`), not only whole strings.
- [ ] Empty and whitespace-only queries match every content and never throw; normalizing `''` returns `''`.
- [ ] Inputs are not mutated and the functions are synchronous and deterministic.
- [ ] Tests need no rendering, mocks, database, or clock; the module imports neither React nor InsForge.
- [ ] Focused tests, the full frontend suite, and TypeScript checking pass during verification.

## Verification Plan

Run during apply/verify, not as evidence for this proposal:

```sh
cd frontend && pnpm test -- src/modules/listas/domain/busqueda.test.ts
cd frontend && pnpm test
cd frontend && pnpm exec tsc --noEmit
```

## References

- Task: `docs/tareas/042-dominio-busqueda.md`
- Consumer: `docs/tareas/054-ui-buscador.md`
- Exploration: `openspec/changes/dominio-busqueda/explore.md`
- Research: `openspec/changes/dominio-busqueda/research.md`
- Neighbors: `frontend/src/modules/listas/domain/lista.ts`, `articulo.ts`
- Architecture: `docs/03-Arquitectura.md` §3.1 (pure domain boundary)
