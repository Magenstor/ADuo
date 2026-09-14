# Listas Collections Specification

## Purpose

Hold `Lista` and `Articulo` records in TanStack DB collections backed by `queryCollectionOptions`, sized so periodic refetch stays out of the way of realtime direct writes, with optimistic mutations that delegate to `listas-repository`.

## Requirements

### Requirement: One `queryCollectionOptions` collection per table

`listasCollection.ts` and `articulosCollection.ts` MUST each build a collection via `queryCollectionOptions`, supplying `queryKey`, `queryFn`, `queryClient`, and `getKey`. `getKey` MUST return the record's `id`.

#### Scenario: The collection loads from the query function

- GIVEN a `queryFn` that resolves a list of `Lista` records
- WHEN the collection is created and its initial load runs
- THEN the collection's contents equal the resolved `Lista` records
- AND each record is retrievable by its `id` via `getKey`

### Requirement: Mutation handlers delegate to the repository

`onInsert`, `onUpdate`, and `onDelete` MUST call the corresponding `listasRepository` / `articulosRepository` function with the mutation's data, and MUST NOT perform PostgREST calls directly.

#### Scenario: An insert mutation calls the repository create function

- GIVEN a collection insert of a new `Lista`
- WHEN `onInsert` runs
- THEN the repository's create function is called with that `Lista`'s data
- AND no other network call is made by the collection handler

#### Scenario: A delete mutation calls the repository delete function

- GIVEN a collection delete of an existing `Articulo`
- WHEN `onDelete` runs
- THEN the repository's delete function is called with that item's id

### Requirement: High `staleTime` to avoid clobbering realtime writes

Both collections MUST configure a `staleTime` high enough that TanStack Query's periodic refetch does not run inside a normal session, so that a row applied by the realtime translator (`listas-realtime`) is not immediately overwritten by a subsequent `queryFn` execution returning stale server state.

#### Scenario: A realtime-applied write survives past the default stale window

- GIVEN a collection configured with the project's `staleTime`
- AND a record written directly into the collection via `writeUpdate` moments ago
- WHEN the time elapsed since the initial load is less than the configured `staleTime`
- THEN no automatic background refetch has been triggered by staleness alone
- AND the realtime-applied value remains in the collection

### Requirement: Optimistic mutations revert on server rejection

When `onInsert`, `onUpdate`, or `onDelete` rejects (the delegated repository call throws or rejects), the collection MUST revert the optimistic change so the collection's state matches the last confirmed server state for that key.

#### Scenario: A rejected update reverts to the prior confirmed value

- GIVEN an `Articulo` in the collection with `contenido: "Leche"`
- AND an optimistic update sets `contenido: "Pan"`
- WHEN the delegated repository update call rejects
- THEN the collection's record for that id returns to `contenido: "Leche"`

#### Scenario: A rejected delete restores the removed record

- GIVEN a `Lista` present in the collection
- AND an optimistic delete removes it from the collection
- WHEN the delegated repository delete call rejects
- THEN the `Lista` is present in the collection again with its prior data
