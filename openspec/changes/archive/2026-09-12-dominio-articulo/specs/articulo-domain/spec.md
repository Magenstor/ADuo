# Articulo Domain Specification

## Purpose

Provide a framework- and persistence-independent TypeScript representation of a shopping-list article, deterministic purchase-state transitions, and stable incorporation ordering.

## Requirements

### Requirement: Public article contract

The domain module MUST export `Articulo` with these Spanish camelCase fields: `id`, `listaId`, `householdId`, `contenido`, `comprado`, `boughtAt`, `boughtBy`, `createdAt`, `createdBy`, `updatedAt`, and `updatedBy`.

`id`, `listaId`, `householdId`, `contenido`, `createdAt`, `createdBy`, `updatedAt`, and `updatedBy` MUST be strings. `comprado` MUST be a boolean. `boughtAt` and `boughtBy` MUST each be `string | null`. `createdAt`, `updatedAt`, and non-null `boughtAt` values MUST be ISO 8601 date-time strings representing instants. The module MUST preserve supplied values and MUST NOT generate identifiers, dates, or audit values.

#### Scenario: Article represents pending purchase metadata

- GIVEN article data with `comprado: false`
- WHEN it is represented as an `Articulo`
- THEN `boughtAt` is `null`
- AND `boughtBy` is `null`
- AND all identity, ownership, content, and audit fields are present

### Requirement: Deterministic marking API

The domain module MUST export `marcarArticuloComprado(articulo: Articulo, boughtAt: string, boughtBy: string): Articulo`.

`marcarArticuloComprado` MUST return a newly allocated `Articulo` with `comprado: true`, `boughtAt` equal to the caller-supplied `boughtAt`, and `boughtBy` equal to the caller-supplied `boughtBy`. It MUST preserve every other field exactly as supplied in `articulo`, MUST NOT mutate `articulo`, and MUST NOT derive either purchase value from a clock, authentication context, or external dependency.

#### Scenario: Marking records the supplied purchase values

- GIVEN a pending article and explicit purchaser ID and purchase timestamp values
- WHEN `marcarArticuloComprado` is called
- THEN it returns a distinct article object marked as purchased
- AND its `boughtAt` and `boughtBy` equal the supplied values exactly
- AND all non-purchase fields equal the input article's values
- AND the input article remains unchanged

### Requirement: Coherent unmarking API

The domain module MUST export `desmarcarArticuloComprado(articulo: Articulo): Articulo`.

`desmarcarArticuloComprado` MUST return a newly allocated `Articulo` with `comprado: false`, `boughtAt: null`, and `boughtBy: null`. It MUST preserve every other field exactly as supplied in `articulo` and MUST NOT mutate `articulo`. The returned state MUST keep the purchase flag and both purchase-metadata fields coherent with the database `comprado_coherente` CHECK condition.

#### Scenario: Unmarking clears purchase metadata together

- GIVEN a purchased article with non-null `boughtAt` and `boughtBy`
- WHEN `desmarcarArticuloComprado` is called
- THEN it returns a distinct pending article
- AND `comprado` is `false`
- AND both `boughtAt` and `boughtBy` are `null`
- AND every non-purchase field is preserved
- AND the input article remains unchanged

#### Scenario: A mark and unmark round trip preserves non-purchase data

- GIVEN an article and explicit purchase timestamp and purchaser ID values
- WHEN it is marked and the result is then unmarked
- THEN the final article has the original identity, ownership, content, creation, and update metadata
- AND the final article has `comprado: false`, `boughtAt: null`, and `boughtBy: null`

### Requirement: Stable incorporation ordering API

The domain module MUST export `ordenarArticulosPorIncorporacion(articulos: readonly Articulo[]): Articulo[]`.

`ordenarArticulosPorIncorporacion` MUST return a newly allocated array containing every input article occurrence exactly once. It MUST place articles with `comprado: false` before articles with `comprado: true`. Within each purchase-state group, it MUST order articles by their `createdAt` incorporation instant in ascending chronological order. It MUST compare date-time instants rather than their raw string representations, so offset-form ISO 8601 values sort chronologically. For equal incorporation instants within a group, it MUST preserve the articles' relative input order. It MUST NOT mutate the input array or any input article, and it MUST NOT filter purchased articles or render UI.

#### Scenario: Pending articles precede purchased articles while all remain visible

- GIVEN pending and purchased articles whose incorporation times are interleaved
- WHEN `ordenarArticulosPorIncorporacion` is called
- THEN every input article is present in the returned array
- AND all pending articles appear before every purchased article
- AND each group is ordered by ascending incorporation instant

#### Scenario: Equal incorporation instants retain input order

- GIVEN two articles in the same purchase state with equal `createdAt` instants
- WHEN `ordenarArticulosPorIncorporacion` is called
- THEN their relative order matches their relative order in the input array

#### Scenario: Offset-form timestamps are ordered by instant without mutation

- GIVEN articles in the same purchase state whose offset-form `createdAt` strings have chronological order different from lexical string order
- WHEN `ordenarArticulosPorIncorporacion` is called
- THEN the returned array follows chronological incorporation order
- AND the returned array is not the input array
- AND the input array and its article objects remain unchanged

#### Scenario: Empty and single-article inputs return fresh arrays

- GIVEN an empty array or an array containing one article
- WHEN `ordenarArticulosPorIncorporacion` is called
- THEN it retains the same article occurrences in the expected order
- AND it returns a new array without mutating the input

### Requirement: Pure domain boundary

The article domain module MUST be pure synchronous TypeScript. It MUST NOT import or depend on React, InsForge, database access, repository mapping, UI rendering, mocks, authentication state, or external services.

The module MUST NOT perform article creation or content validation, editing, deletion, bulk clearing, manual-position management, authorization, persistence, or audit-field updates.

#### Scenario: Domain behavior requires only supplied values

- GIVEN a TypeScript test that imports the article domain module directly
- WHEN it invokes the marking, unmarking, or ordering API with literal article data
- THEN the result is determined solely by those supplied values
- AND no rendering, mock, database, or external-service interaction is required
