# Lista Domain Specification

## Purpose

Provide a framework- and persistence-independent TypeScript representation of a shopping list and deterministic, Result-based creation with normalized name validation.

## Requirements

### Requirement: Public list contract

The domain module MUST export `Lista`, representing a shopping list with `id`, `householdId`, `nombre`, `createdAt`, `createdBy`, `updatedAt`, and `updatedBy`.

All identity and audit fields MUST be strings. `createdAt` and `updatedAt` MUST be ISO 8601 date-time strings (including an offset or `Z`) and MUST be preserved as supplied; list creation MUST NOT generate or transform identity, household, or audit values.

#### Scenario: Successful creation preserves supplied list data

- GIVEN supplied identifiers, ISO 8601 audit timestamps, audit-user identifiers, and a valid name
- WHEN `crearLista` creates a list
- THEN the successful result contains a `Lista` with all seven fields
- AND every non-name field equals its supplied value

### Requirement: Result-based list creation API

The domain module MUST export `crearLista`, `ResultadoCrearLista`, and `ErrorNombreLista`.

`crearLista` MUST return `ResultadoCrearLista` as a discriminated union on `ok`: a successful result has `ok: true` and `lista: Lista`; a validation failure has `ok: false` and `error: ErrorNombreLista`.

`ErrorNombreLista` MUST have the values `"nombre-vacio"` and `"nombre-demasiado-largo"`. `crearLista` MUST return a failure rather than throw when name validation fails.

#### Scenario: Whitespace-only name returns an explicit validation failure

- GIVEN list creation data whose name contains only whitespace
- WHEN `crearLista` is called
- THEN it returns `{ ok: false, error: "nombre-vacio" }`
- AND the call does not throw

#### Scenario: Name beyond the limit returns an explicit validation failure

- GIVEN list creation data whose normalized name has 81 Unicode code points
- WHEN `crearLista` is called
- THEN it returns `{ ok: false, error: "nombre-demasiado-largo" }`
- AND the call does not throw

### Requirement: Name normalization and bounds

`crearLista` MUST remove leading and trailing ECMAScript whitespace from the supplied name before validation and before returning a successful `Lista`.

The normalized name MUST contain at least one Unicode code point and no more than 80 Unicode code points. Length MUST be measured in Unicode code points, not UTF-16 code units or grapheme clusters. Internal whitespace MUST remain unchanged.

#### Scenario: Normalized boundary lengths are accepted

- GIVEN a name that normalizes to one Unicode code point
- WHEN `crearLista` is called
- THEN it returns a successful result
- GIVEN a name that normalizes to 80 Unicode code points, including astral Unicode code points where applicable
- WHEN `crearLista` is called
- THEN it returns a successful result

#### Scenario: Trimming precedes validation and result construction

- GIVEN a name with leading and trailing whitespace whose trimmed form is valid
- WHEN `crearLista` is called
- THEN it returns a successful result whose `lista.nombre` is the trimmed form
- AND the result does not retain the removed leading or trailing whitespace

#### Scenario: Internal whitespace remains unchanged

- GIVEN a valid name containing consecutive or mixed internal whitespace
- WHEN `crearLista` is called
- THEN it returns a successful result whose `lista.nombre` preserves that internal whitespace exactly

### Requirement: Deliberately limited domain validation

The list domain MUST permit two lists with the same normalized name. It MUST NOT impose validation beyond the normalized-name rules in this specification.

The domain module MUST remain pure TypeScript and MUST NOT depend on React, InsForge, database access, UI rendering, mocks, or repository mapping.

#### Scenario: Duplicate normalized names are permitted

- GIVEN two otherwise valid list-creation inputs for the same household with names that normalize to the same value
- WHEN `crearLista` is called for each input
- THEN both calls return successful results

#### Scenario: Creation has no framework or persistence dependency

- GIVEN the domain module is evaluated in a TypeScript test environment
- WHEN `crearLista` is used with valid or invalid input
- THEN its outcome is determined solely by the supplied input
- AND no UI, persistence, or external-service interaction is required
