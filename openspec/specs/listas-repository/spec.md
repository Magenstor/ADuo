# Listas Repository Specification

## Purpose

Provide the only path between PostgREST (`shopping_lists`, `shopping_items`) and `modules/listas/domain/`: CRUD functions that accept and return `Lista` / `Articulo` domain types, never the raw table row shape.

## Requirements

### Requirement: Domain-typed CRUD surface

`listasRepository.ts` and `articulosRepository.ts` MUST expose create, read, update, and delete operations against PostgREST for `shopping_lists` and `shopping_items` respectively. Every operation's return type MUST be `Lista` / `Articulo` (or a collection thereof); no function MUST return or accept a raw PostgREST row shape.

#### Scenario: A create call returns a domain type

- GIVEN valid `Lista`-shaped creation data
- WHEN the repository create function is called
- THEN the resolved value is a `Lista` with `nombre`, `householdId`, and the other domain fields
- AND no field named `name` or `household_id` is present on the returned value

#### Scenario: A read call never exposes raw columns

- GIVEN `shopping_items` rows exist for a list
- WHEN the repository read function is called for that list
- THEN every returned item is an `Articulo` with `contenido`, `comprado`, `listaId`
- AND no returned item carries `content`, `is_bought`, or `list_id`

### Requirement: Bidirectional row-domain mapping

The repositories MUST translate PostgREST rows into domain types on read, and domain types into PostgREST payloads on write, per this mapping:

`shopping_lists` ↔ `Lista`: `id`↔`id`, `household_id`↔`householdId`, `name`↔`nombre`, `created_at`↔`createdAt`, `created_by`↔`createdBy`, `updated_at`↔`updatedAt`, `updated_by`↔`updatedBy`.

`shopping_items` ↔ `Articulo`: `id`↔`id`, `list_id`↔`listaId`, `household_id`↔`householdId`, `content`↔`contenido`, `is_bought`↔`comprado`, `bought_by`↔`boughtBy`, `bought_at`↔`boughtAt`, `created_at`↔`createdAt`, `created_by`↔`createdBy`, `updated_at`↔`updatedAt`, `updated_by`↔`updatedBy`.

#### Scenario: A round trip preserves every field

- GIVEN a `Lista` with all seven fields populated
- WHEN it is mapped to a PostgREST payload and the resulting row is mapped back to a `Lista`
- THEN the result equals the original `Lista`

#### Scenario: An update payload uses table column names

- GIVEN a domain-level update to an `Articulo`'s `contenido`
- WHEN the repository builds the PostgREST update payload
- THEN the payload key is `content`, not `contenido`

### Requirement: Exact preservation of the purchase tri-state

The mapper MUST preserve `comprado` / `boughtAt` / `boughtBy` exactly as read from `is_bought` / `bought_at` / `bought_by`, without independently deriving or correcting any of the three, mirroring the database's `comprado_coherente` CHECK constraint.

#### Scenario: An unpurchased row maps to all-empty purchase fields

- GIVEN a row with `is_bought: false`, `bought_at: null`, `bought_by: null`
- WHEN it is mapped to an `Articulo`
- THEN `comprado` is `false`, `boughtAt` is `null`, and `boughtBy` is `null`

#### Scenario: A purchased row maps to fully populated purchase fields

- GIVEN a row with `is_bought: true`, a non-null `bought_at`, and a non-null `bought_by`
- WHEN it is mapped to an `Articulo`
- THEN `comprado` is `true` and `boughtAt` / `boughtBy` equal the row's values exactly

### Requirement: Hard delete with no soft-delete filter

Delete operations MUST issue a physical PostgREST delete. No delete operation, and no other repository query, MUST include a `deleted_at` filter or any equivalent soft-delete predicate, because no such column exists on `shopping_lists` or `shopping_items`.

#### Scenario: Deleting a list issues no soft-delete filter

- GIVEN a list id to delete
- WHEN the repository delete function is called
- THEN the resulting PostgREST request carries no `deleted_at` filter or column reference
- AND no other filter beyond the identifying key is added

#### Scenario: Deleting an item issues no soft-delete filter

- GIVEN an item id to delete
- WHEN the repository delete function is called
- THEN the resulting PostgREST request carries no `deleted_at` filter or column reference
