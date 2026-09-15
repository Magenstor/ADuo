# shopping-application-hooks Specification

## Purpose

Expose live household-scoped list and article projections plus typed, validated, optimistic shopping actions with observable persistence outcomes.

## Scope and Compatibility

This change defines two new capabilities: `household-context` and `shopping-application-hooks`. It SHALL preserve the established domain, repository, collection, realtime translation, and server-cascade contracts. Bootstrap/provisioning, backend or schema changes, UI/routes, offline queues, raw-collection exposure, and custom self-echo deduplication are out of scope.

## Requirements

### Requirement: Public shopping hook contract

`useListas` MUST expose the current household's derived list array, query readiness/loading state, error state, and typed `crear`, `renombrar`, and `eliminar` actions. `useArticulos(listaId)` MUST expose only the supplied list's derived article array, query readiness/loading state, error state, and typed `agregar`, `editar`, `marcar`, `desmarcar`, `eliminar`, and `limpiarComprados` actions. No action or state from either hook MAY expose a raw collection. All actions MUST provide a persistence outcome: success only after persistence succeeds, and a surfaced failure when persistence fails; `limpiarComprados` MUST provide its per-ID partial outcome.

#### Scenario: Hooks expose the complete supported public surface

- GIVEN a consumer is within a ready household provider
- WHEN it calls `useListas` and `useArticulos` for a valid list
- THEN it receives the stated derived state and typed actions
- AND it receives no SDK or raw collection API.

#### Scenario: A persistence failure is observable

- GIVEN a consumer invokes a valid list or article mutation
- WHEN persistence fails
- THEN the action settles with a surfaced failure outcome
- AND the hook's error state makes the failure observable to the consumer.

### Requirement: Household and list filtering with deterministic domain ordering

`useListas` MUST project only lists belonging to the ready household. `useArticulos(listaId)` MUST project only articles belonging both to the ready household and to `listaId`; articles from any other list MUST be excluded. Each projection MUST retain the deterministic ordering established by the existing domain/collection contract, including after optimistic changes, realtime changes, and rollback. A non-current, malformed, or inaccessible `listaId` MUST expose an empty article projection and MUST NOT leak articles from another list.

#### Scenario: Lists and articles are filtered to their owning scope

- GIVEN household A has lists A1 and A2, and household B has list B1
- WHEN `useListas` is read in household A and `useArticulos(A1)` is read
- THEN the list projection contains A1 and A2 but not B1
- AND the article projection contains only A1 articles.

#### Scenario: Projection ordering remains deterministic

- GIVEN the domain collection supplies records in its defined order
- WHEN an optimistic mutation, realtime update, or rollback changes a projection
- THEN the returned array follows that same defined order
- AND consumers do not receive an arbitrary insertion or transport order.

### Requirement: Action validation prevents invalid mutations

Before changing optimistic state or requesting persistence, every action MUST validate its required identifiers, household/list scope, and editable values against the existing domain constraints. In particular, create/rename/add/edit names or content MUST be valid non-empty domain values after required normalization, a target list or article MUST be current and addressable, and mark/unmark MUST operate on a valid current article. Invalid input or an unavailable household/list MUST surface a validation failure, MUST make no persistence request, and MUST make no optimistic change.

#### Scenario: Invalid list name is rejected before creation

- GIVEN a ready household
- WHEN `crear` or `renombrar` receives an empty or otherwise domain-invalid name
- THEN the action reports validation failure
- AND the list projection and persistence store remain unchanged.

#### Scenario: Article action cannot escape its list scope

- GIVEN `useArticulos(A1)` is active and article A2 belongs to another list
- WHEN an article action targets A2 through the A1 hook
- THEN the action reports validation failure
- AND it does not mutate or persist A2.

### Requirement: Create, rename, add, edit, mark, unmark, and single-delete are optimistic and rollback safely

For each valid supported single-record mutation, the relevant projection MUST update optimistically using provisional client identity/time where creation needs it. The mutation MUST await its persistence outcome. On persistence success, the action MUST report success; subsequent server/realtime data remains authoritative and is resolved by the established last-write-wins contract. On persistence failure, the optimistic change MUST be rolled back so the pre-action visible state is restored, and the failure MUST be surfaced. The hooks MUST NOT add custom self-echo deduplication; they SHALL rely on the existing realtime translation contract.

#### Scenario: Optimistic create becomes authoritative on server echo

- GIVEN a ready household and a valid create-list or add-article request
- WHEN the action begins before persistence settles
- THEN the new record appears in the appropriate projection with provisional client values
- WHEN persistence succeeds and the server/realtime version arrives
- THEN the projection converges to the authoritative version under last-write-wins
- AND no custom hook-level echo deduplication is applied.

#### Scenario: Failed article edit rolls back

- GIVEN a visible article with existing editable values
- WHEN `editar` optimistically changes it and persistence fails
- THEN the projection restores its complete pre-edit visible values
- AND the action and error state expose the failure.

#### Scenario: Failed mark, unmark, or single delete rolls back

- GIVEN a visible current article
- WHEN `marcar`, `desmarcar`, or `eliminar` changes it optimistically and persistence fails
- THEN its bought state or visibility is restored to the pre-action state
- AND no failed mutation remains represented as success.

### Requirement: List deletion preserves child visibility semantics

A valid `eliminar` list action MUST immediately remove the list and all of its projected child articles from visibility. It MUST persist only the list deletion and MUST NOT issue separate child-delete persistence operations. If list deletion fails, it MUST restore the list and every child article to a mutually consistent visible state and established order. If it succeeds, the list and children MUST remain absent from the relevant projections, subject to authoritative server/realtime updates.

#### Scenario: Pending list deletion hides its children without child writes

- GIVEN list A1 has visible child articles
- WHEN `eliminar(A1)` starts and is pending
- THEN A1 is absent from `useListas` and its children are absent from shopping projections
- AND persistence is requested only for A1, not separately for each child.

#### Scenario: Failed list deletion restores the complete visible subtree

- GIVEN list A1 and its child articles were hidden optimistically
- WHEN list deletion persistence fails
- THEN A1 and all its children are visible again in their pre-delete derived order
- AND the surfaced action result identifies the failure.

### Requirement: Clear-bought reports and preserves partial outcomes

`limpiarComprados` MUST select only bought articles in its current list scope and issue independent delete persistence attempts for them. It MUST return an outcome containing successful IDs and failed IDs, each in the selected input order. It MUST keep successfully deleted articles removed, restore only articles whose deletes failed, and surface partial failure rather than treating the operation as wholly successful or wholly rolled back. When no bought articles are selected, it MUST return empty successful and failed ID collections and MUST make no persistence request.

#### Scenario: Clear-bought has mixed results

- GIVEN a list has bought articles X and Y and an unbought article Z
- WHEN `limpiarComprados` is invoked, X persists successfully, and Y persistence fails
- THEN the outcome identifies X as successful and Y as failed
- AND X remains absent, Y is restored, and Z remains visible.

#### Scenario: Clear-bought finds nothing to delete

- GIVEN a current list has no bought articles
- WHEN `limpiarComprados` is invoked
- THEN it returns empty successful and failed ID collections
- AND it makes no delete persistence request.

### Requirement: Shopping hooks react safely to household lifecycle and realtime failures

Shopping hooks MUST become non-ready and clear prior-household derived records while household resolution is loading, `sin-hogar`, or erroneous. They MUST reproject only the newly ready household after a session or household transition. A realtime failure supplied by the provider MUST be exposed through each affected hook's public error state without leaking or retaining prior-household records. Realtime events, including a mutation's own echo, MUST continue through the existing translator and server-authoritative last-write-wins behavior without hook-level custom deduplication.

#### Scenario: Household change clears stale shopping data

- GIVEN `useListas` and `useArticulos(A1)` currently show household A data
- WHEN the session changes and resolution for household B begins
- THEN the hooks are non-ready and no longer expose A records
- WHEN household B becomes ready
- THEN they expose only B-scoped projections.

#### Scenario: Realtime error is exposed without corrupting projections

- GIVEN a ready household with an established shopping projection
- WHEN the provider receives a realtime error
- THEN each affected shopping hook exposes that error
- AND it does not substitute another household's records or fabricate a successful realtime state.

## Out of Scope

This specification does not require bootstrap or household provisioning, backend migrations/functions/bulk endpoints, UI or routes, offline mutation queues, direct raw-collection access, or any custom client-side self-echo deduplication.
