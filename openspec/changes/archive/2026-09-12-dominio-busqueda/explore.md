# Exploration: `dominio-busqueda`

## Scope and status

- **Task:** `docs/tareas/042-dominio-busqueda.md`
- **Target implementation files:** `frontend/src/modules/listas/domain/busqueda.ts` and colocated `busqueda.test.ts`
- **Status:** ready for proposal/spec/design/tasks; no implementation, tests, or other files were changed during exploration.
- **Skill resolution:** none — `.atl/skill-registry.md` has no entry matching pure TypeScript domain/normalization work.
- **Persistence:** hybrid. Engram topic `sdd/dominio-busqueda/explore` (observation #484); this file is the OpenSpec half, materialized by the orchestrator because the exploring sub-agent had no file-write tool.

## Current State

- `frontend/src/modules/listas/domain/` currently holds `lista.ts`/`lista.test.ts` and `articulo.ts`/`articulo.test.ts`. Both are pure synchronous TypeScript: no React, no InsForge, no mocks; tests use literal fixtures and direct relative imports (`./lista`, `./articulo`) with Vitest globals.
- `lista.ts` already treats Unicode carefully: it trims ECMAScript whitespace and counts length with `Array.from(nombre).length` (code points, not UTF-16 units), documented and tested against astral characters and combining-mark sequences.
- No search, filtering, or text-normalization code exists anywhere else under `frontend/src` today (confirmed by a repo-wide search for `normalize|localeCompare|Collator|toLowerCase|busqueda|buscar|filtr`, case-insensitive — the only hits are the word "normalized" in `lista.test.ts` describe-block prose, unrelated to text search). Task 042 has nothing to absorb or deduplicate; this is greenfield.
- `frontend/src/modules/listas/index.ts` is an intentionally empty barrel (`export {}`) with a documented rule: only what is re-exported there is public. Precedent (040, 041) did not touch this barrel and 042 should not either unless a later task requires it.
- `docs/03-Arquitectura.md` §3.1 states `domain/` is pure TypeScript with zero React/InsForge imports, testable without mocks, and is where product-correctness logic belongs. The same rigor bar applies to search correctness here.

## Precedent shape (040/041, archived)

Both prior domain tasks (`openspec/changes/archive/2026-09-12-dominio-lista/`, `...-dominio-articulo/`) followed the same artifact shape and are the template for 042:

- `proposal.md`: Intent / Scope (In/Out) / Capabilities / Approach / Affected Areas / Risks / Rollback / Success Criteria / Verification Plan / References.
- `specs/{domain}/spec.md`: RFC-2119 requirements, each with Given/When/Then scenarios; a final "pure domain boundary" requirement stating no React/InsForge/persistence/mocks.
- `design.md`: Technical Approach, an Architecture Decisions table (Option | Tradeoff | Decision+rationale), Interfaces/Contracts (exact exported signatures), Data Flow, File Changes, Testing Strategy, Threat Matrix (N/A for pure domain), Migration/Rollout, Open Questions.
- `tasks.md`: Review Workload Forecast table, Scope Boundary paragraph, RED/GREEN/TRIANGULATE/REFACTOR/Verify tasks, Delivery Notes. Both prior changes forecast 150–260 changed lines, Low budget risk, single PR, no chaining.
- Both explicitly deferred exact exported function/type names to the spec phase — task text does not specify signatures, only behavior. 042 is the same: the task file names only the file, not the API.

Only `dominio-articulo` left behind an `explore.md` (the `dominio-lista` run skipped explore). Its structure is the closest local precedent for this document's shape.

## Consumer contract (task 054, `docs/tareas/054-ui-buscador.md`)

054 is blocked by 042 and states the contract 042 must satisfy:

- A search field "filtra por texto usando la normalización del dominio" — 054 explicitly delegates normalization to the domain module produced by 042; it does not renormalize independently.
- Filtering must preserve the existing pending-before-purchased grouping (`ordenarArticulosPorIncorporacion` from `articulo.ts`), so 054 composes 042's normalization with 041's ordering rather than one function doing both.
- Filtering runs entirely client-side over already-in-memory articles: "no query text in the TanStack Query key" is an explicit non-negotiable ("El texto de búsqueda no forma parte de la query key"). This confirms 042 has zero persistence/query/hook coupling — it is a pure string function, never a data-fetching concern.
- 054's own "Hecho cuando" — "Buscar `azucar` encuentra `Azúcar`" — is the same example as 042's own acceptance bullet, meaning 042's normalization function is the single source of truth 054 will call for every keystroke; 042 must be correct and complete standalone.

**Open question for the propose/spec phase:** does 042 export only a normalization primitive (e.g. `normalizeForSearch(text): string`), leaving the substring check and the "empty query matches everything" rule to 054's application/UI layer — or does 042 also export a matching predicate (e.g. `matchesSearch(content, query): boolean`) that owns the substring check and empty-query semantics so that rule lives in one place instead of being re-implemented by every future consumer? The task text does not decide this.

## Technical options: accent- and case-insensitive Spanish matching

The task needs substring matching (the query is a fragment, e.g. "leche" must match content "Leche entera"), not just equality — this rules out solutions that only support two-string comparison.

### Option 1 — `normalize('NFD')` + strip combining marks + `toLowerCase()`, then `String.includes`

Decompose both the content and the query with `String.prototype.normalize('NFD')` (pure ECMAScript, no ICU/Intl dependency, identical in V8/Node and jsdom), strip Unicode combining diacritical marks (U+0300–U+036F) with a regex, lowercase, then use plain `.includes()` for the substring check.

- **The ñ decision (must be explicit, not incidental):** NFD canonically decomposes `ñ`/`Ñ` (U+00F1/U+00D1) into `n`/`N` + COMBINING TILDE (U+0303). A generic "strip every combining mark in U+0300–U+036F" regex silently folds `ñ` into plain `n`. In Spanish that is not diacritic removal, it is a **letter substitution** — `ñ` is its own letter, not an accented `n` — and it produces real collisions in ordinary shopping-list vocabulary (`año` → `ano`, `piña` → `pina`, `caña` → `cana`). Recommendation: exclude U+0303 from the stripped range so `ñ`/`Ñ` survive intact and compare equal only to themselves, while `á/é/í/ó/ú/ü` (and uppercase) still fold to their plain vowel. This must be a named, tested requirement in the spec, not an accidental side effect of a generic regex.
- Pros: standard idiom, no ICU dependency (safe in jsdom and any Node version), correctly supports substring search, cheap to implement and test, the ñ exclusion is a one-line auditable decision.
- Cons: requires knowing the specific NFD decomposition and combining-mark-range trivia; a naive implementation gets the wrong answer for Spanish unless review catches it — exactly why the task calls it a domain rule, not a UI detail.
- Effort: Low.

### Option 2 — Explicit character-substitution map (`á`→`a`, `é`→`e`, …), no `normalize()`

Maintain a small literal map/regex of the accented Spanish vowels to their plain form, applied after `toLowerCase()`, with `ñ`/`Ñ` simply never appearing in the map (so folding is impossible by construction, not by a range exclusion that must be remembered).

- Pros: correctness for `ñ` is structural; fully deterministic across engines (no reliance on NFD decomposition behavior); trivial to read and audit in review.
- Cons: less idiomatic than `normalize()`; covers only the enumerated Spanish accented characters (fine for this domain's alphabet, not a general Unicode diacritic solution if scope grows beyond Spanish).
- Effort: Low.

### Option 3 — `localeCompare` / `Intl.Collator` with `{ sensitivity: 'base' }`

Use locale-aware comparison to treat accented and uppercase variants as equal.

- Pros: leverages a platform-standard collation API; no manual Unicode range logic.
- Cons: **no substring primitive** — `Collator`/`localeCompare` compare two whole strings for equality/ordering only; substring search would need `Intl.Segmenter` plus a manual per-grapheme sliding window, materially more complex than Option 1 or 2 for the same result. Independently, `sensitivity: 'base'` behavior for `ñ` vs `n` is collation-tailoring-dependent: modern (post-1994) Spanish collation orders `ñ` adjacent to `n` and differs from it only at a secondary/tertiary level in most current ICU data, which plausibly makes `'ñ'.localeCompare('n', 'es', {sensitivity:'base'})` return `0` — the opposite of the recommended behavior. This was **not empirically verified**; treat it as an unknown, not a fact. The substring limitation alone rules the option out regardless.
- Effort: Medium–High.

## Approaches comparison

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| 1. NFD + range-strip (excluding U+0303) + `includes` | Idiomatic, no ICU dependency, correct substring search, one auditable exclusion line | Requires NFD/combining-mark knowledge; easy to get wrong without a named test | Low |
| 2. Explicit accented-vowel map + `includes` | `ñ` safety by construction, fully deterministic, easiest to audit | Not idiomatic; enumerated set covers Spanish vowels only | Low |
| 3. `localeCompare`/`Intl.Collator` base sensitivity | Standard platform API | No substring primitive (needs `Intl.Segmenter` + sliding window); ñ-vs-n outcome is ICU-dependent, unverified, and likely wrong for this domain | Medium–High |

## Recommendation

Option 1 (NFD decomposition with a combining-mark strip that explicitly excludes U+0303), with Option 2 as an equally acceptable, slightly more conservative alternative if design prefers structural certainty over the standard idiom. Reject Option 3: it does not natively support substring search and its `ñ` behavior is an unverified platform dependency rather than a controlled decision.

Whichever is chosen, the spec MUST state as a named requirement — not an implementation detail — that `ñ`/`Ñ` are preserved as distinct letters and are never folded to `n`/`N`. This is the one product-correctness decision task 042 flags as "no es un extra, es el mínimo".

## Edge cases required by "Hecho cuando" (task 042) and implied by task 054

- **Accents:** `azucar` (no accent) must match content `Azúcar` (with accent), and the reverse (accented query against unaccented content) must also match — normalization must be applied identically and bidirectionally to both query and content.
- **Case:** `AZUCAR`, `Azucar`, and `azucar` must all match `Azúcar` content.
- **Empty string:** normalizing `''` must return `''` without throwing. Whether a matching predicate returns `true` for every content on an empty query (no active filter) is behavior 054 needs but task 042's own text does not decide — flag for spec.
- **Whitespace-only query:** not mentioned by 042 but implied by 054's UX; recommend trimming the query the same way `crearLista` trims names, so a whitespace-only query behaves like an empty query rather than matching nothing.
- **Substring position:** matching must be "content contains normalized query" (`includes`), not full-string equality — 054's example items have multi-word content (e.g. "Pan integral") and the field filters as the user types.
- **Astral characters / surrogate pairs:** `.includes()` operates correctly on UTF-16 substrings regardless of astral characters (unlike `lista.ts`'s code-point-*counting* concern). No special handling is needed and task 042 does not ask for it.

## Affected Areas

- `frontend/src/modules/listas/domain/busqueda.ts` — new file, pure TypeScript normalization (and possibly matching) function(s).
- `frontend/src/modules/listas/domain/busqueda.test.ts` — new colocated Vitest tests, literal fixtures, no rendering or mocks.
- `frontend/src/modules/listas/index.ts` — not expected to change (precedent: 040/041 did not touch it); confirm in spec/design only if 054 needs a barrel export.

## Risks

- Choosing a generic diacritic-strip regex without excluding the `ñ` combining tilde produces silently wrong Spanish search behavior (`año`/`ano`, `piña`/`pina` collisions) — must be a named spec requirement and a named test, not left implicit.
- Deciding the empty-query/whitespace-query matching contract inside 042 versus leaving it to 054 is unresolved; if left unresolved into implementation, 054 may re-implement and diverge from domain normalization, violating its own stated delegation constraint.
- Task 054 also needs composition with `ordenarArticulosPorIncorporacion` (041) to preserve grouping while filtering; 042's scope must stay limited to normalization/matching and must not attempt to own ordering, keeping the domain boundary clean per the two prior precedents.

## Ready for Proposal

Yes. Domain conventions, the consumer contract, and the technical trade-offs are grounded in real code and archived precedent. The only genuine open decision — normalization-primitive-only versus normalization-plus-matching-predicate API surface, and the exact exported names — is the kind of detail the prior two changes deferred to `sdd-propose`/`sdd-spec`, not a blocker.
