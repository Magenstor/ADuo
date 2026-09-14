# Busqueda Domain Specification

## Purpose

Provide a framework- and persistence-independent TypeScript text-normalization primitive and substring-matching predicate for Spanish-aware search over shopping-list content, with `ñ`/`Ñ` preserved as their own letters.

## Requirements

### Requirement: Public search contract

The domain module MUST export `normalizarParaBusqueda(texto: string): string` and `coincideConBusqueda(contenido: string, consulta: string): boolean`.

`normalizarParaBusqueda` MUST be a pure function from a single string to a single string: for the same input it MUST always return the same output, it MUST NOT mutate its argument, and it MUST NOT throw for any string input. `coincideConBusqueda` MUST be a pure function from two strings to a boolean, evaluated synchronously with no I/O, timers, or external dependency.

#### Scenario: Both exports are present with the documented signatures

- GIVEN the compiled search domain module
- WHEN `normalizarParaBusqueda` is called with a string argument
- THEN it returns a string
- GIVEN the compiled search domain module
- WHEN `coincideConBusqueda` is called with two string arguments
- THEN it returns a boolean

### Requirement: Case folding

`normalizarParaBusqueda` MUST fold uppercase Latin letters to their lowercase form. `coincideConBusqueda` MUST use this folded form for both `contenido` and `consulta`, so matching is case-insensitive.

#### Scenario: An uppercase query matches lowercase content

- GIVEN content `"azucar"`
- WHEN `coincideConBusqueda("azucar", "AZUCAR")` is called
- THEN it returns `true`

#### Scenario: A mixed-case query matches mixed-case content

- GIVEN content `"Azúcar"`
- WHEN `coincideConBusqueda("Azúcar", "Azucar")` is called
- THEN it returns `true`

### Requirement: True-diacritic folding

`normalizarParaBusqueda` MUST fold the accented Spanish vowels `á`, `é`, `í`, `ó`, `ú`, `ü` and their uppercase forms `Á`, `É`, `Í`, `Ó`, `Ú`, `Ü` to their plain, unaccented vowel (`a`, `e`, `i`, `o`, `u`, `u` respectively) before or as part of case folding.

#### Scenario: An unaccented query matches accented content

- GIVEN content `"Azúcar"`
- WHEN `coincideConBusqueda("Azúcar", "azucar")` is called
- THEN it returns `true`

#### Scenario: Each accented vowel folds to its plain form

- GIVEN the string `"áéíóúÁÉÍÓÚü Ü"`
- WHEN `normalizarParaBusqueda` is called with it
- THEN the returned string contains no accented vowel character
- AND it equals `"aeiouaeiouu u"`

### Requirement: `ñ`/`Ñ` are preserved as distinct letters

`normalizarParaBusqueda` MUST NEVER fold `ñ` or `Ñ` to `n` or `N`. After normalization, `ñ` MUST remain distinguishable from `n`, so a query built from a word containing `ñ` MUST NOT match content whose only difference is that the same letter position holds a plain `n`, and vice versa.

#### Scenario: `piña` does not collide with `pina`

- GIVEN content `"piña"`
- WHEN `coincideConBusqueda("piña", "pina")` is called
- THEN it returns `false`

#### Scenario: `año` does not collide with `ano`

- GIVEN content `"año"`
- WHEN `coincideConBusqueda("año", "ano")` is called
- THEN it returns `false`

#### Scenario: `caña` does not collide with `cana`

- GIVEN content `"caña"`
- WHEN `coincideConBusqueda("caña", "cana")` is called
- THEN it returns `false`

#### Scenario: An `ñ` query still matches `ñ` content regardless of case

- GIVEN content `"Piña"`
- WHEN `coincideConBusqueda("Piña", "PIÑA")` is called
- THEN it returns `true`

### Requirement: `ñ`/`Ñ` preservation holds at the partial-prefix boundary

`ñ`/`Ñ` preservation MUST also hold when the query is only a prefix of the content: a query that stops exactly where the content's letter is `ñ` (or `Ñ`) MUST NOT match by landing on the plain `n` (or `N`) that would sit at that same position if the letter were not preserved. `coincideConBusqueda` MUST NOT return `true` for a query ending in a plain `n`/`N` where the corresponding content position holds `ñ`/`Ñ` instead of a plain `n`/`N`.

#### Scenario: `pin` does not match `piña` at the `ñ` boundary

- GIVEN content `"piña"`
- WHEN `coincideConBusqueda("piña", "pin")` is called
- THEN it returns `false`

#### Scenario: `an` does not match `año` at the `ñ` boundary

- GIVEN content `"año"`
- WHEN `coincideConBusqueda("año", "an")` is called
- THEN it returns `false`

### Requirement: Substring matching

`coincideConBusqueda` MUST return `true` when the normalized `contenido` contains the normalized `consulta` as a substring anywhere within it, not only when the two are equal as whole strings.

#### Scenario: A query fragment matches mid-content in multi-word text

- GIVEN content `"Pan integral"`
- WHEN `coincideConBusqueda("Pan integral", "integral")` is called
- THEN it returns `true`

#### Scenario: A query matching only part of content still matches

- GIVEN content `"Pan integral"`
- WHEN `coincideConBusqueda("Pan integral", "pan")` is called
- THEN it returns `true`

#### Scenario: A query absent from content does not match

- GIVEN content `"Pan integral"`
- WHEN `coincideConBusqueda("Pan integral", "leche")` is called
- THEN it returns `false`

### Requirement: Normalization is applied symmetrically

`coincideConBusqueda` MUST apply `normalizarParaBusqueda` identically to `contenido` and to `consulta` before comparing them, so matching is symmetric with respect to which side carries diacritics.

#### Scenario: An unaccented query matches accented content

- GIVEN content `"Azúcar"`
- WHEN `coincideConBusqueda("Azúcar", "azucar")` is called
- THEN it returns `true`

#### Scenario: An accented query matches unaccented content

- GIVEN content `"azucar"`
- WHEN `coincideConBusqueda("azucar", "azúcar")` is called
- THEN it returns `true`

### Requirement: Empty and whitespace-only queries match every content

`coincideConBusqueda` MUST trim leading and trailing ECMAScript whitespace from `consulta` the way `crearLista` trims list names. If the trimmed `consulta` is the empty string, `coincideConBusqueda` MUST return `true` regardless of the value of `contenido`, including an empty `contenido`.

#### Scenario: An empty query matches non-empty content

- GIVEN content `"Azúcar"`
- WHEN `coincideConBusqueda("Azúcar", "")` is called
- THEN it returns `true`

#### Scenario: A whitespace-only query matches non-empty content

- GIVEN content `"Pan integral"`
- WHEN `coincideConBusqueda("Pan integral", "   ")` is called
- THEN it returns `true`

#### Scenario: An empty query matches empty content

- GIVEN content `""`
- WHEN `coincideConBusqueda("", "")` is called
- THEN it returns `true`

### Requirement: Normalizing an empty string never throws

`normalizarParaBusqueda` MUST return the empty string when called with the empty string, and MUST NOT throw.

#### Scenario: Normalizing the empty string returns the empty string

- GIVEN the empty string `""`
- WHEN `normalizarParaBusqueda("")` is called
- THEN it returns `""`
- AND the call does not throw

### Requirement: Pure domain boundary

The search domain module MUST be pure synchronous TypeScript. It MUST NOT import or depend on React, InsForge, database access, repository mapping, UI rendering, mocks, authentication state, TanStack Query, or any other external service.

The module MUST NOT own text ordering, filtering pipelines, query-key construction, or any persistence concern; it MUST expose only normalization and matching over supplied string values.

#### Scenario: Domain behavior requires only supplied values

- GIVEN a TypeScript test that imports the search domain module directly
- WHEN it invokes `normalizarParaBusqueda` or `coincideConBusqueda` with literal string data
- THEN the result is determined solely by those supplied values
- AND no rendering, mock, database, clock, or external-service interaction is required
