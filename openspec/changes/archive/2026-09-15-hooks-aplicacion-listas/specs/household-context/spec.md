# household-context Specification

## Purpose

Resolve one current household for the active session and provide household-scoped shared resources with a safe React lifecycle.

## Scope and Compatibility

This change defines two new capabilities: `household-context` and `shopping-application-hooks`. It SHALL preserve the established domain, repository, collection, realtime translation, and server-cascade contracts. Bootstrap/provisioning, backend or schema changes, UI/routes, offline queues, raw-collection exposure, and custom self-echo deduplication are out of scope.

## Requirements

### Requirement: Explicit household resolution states

`useHogar` MUST expose only an explicit public resolution state: `loading`, `ready`, `sin-hogar`, or `error`. A `ready` result MUST contain exactly one household and its members. `sin-hogar` MUST represent zero memberships. More than one membership MUST produce an `error` identifying invalid household configuration; it MUST NOT select an arbitrary household. Read failures MUST produce `error` and MUST NOT be represented as an empty household. An absent or changed session MUST clear the prior household result and expose a non-ready state until the new session is resolved.

#### Scenario: One membership resolves a household

- GIVEN the active session has exactly one household membership and the household and member reads succeed
- WHEN household resolution completes
- THEN `useHogar` exposes `ready` with that household and its members
- AND it exposes no other household's members.

#### Scenario: No memberships are not a read failure

- GIVEN the active session resolves with zero household memberships
- WHEN household resolution completes
- THEN `useHogar` exposes `sin-hogar`
- AND it exposes neither a fabricated household nor a configuration error.

#### Scenario: Multiple memberships are configuration-invalid

- GIVEN the active session resolves with two or more household memberships
- WHEN household resolution completes
- THEN `useHogar` exposes `error` for invalid household configuration
- AND no shopping resources are initialized for either membership.

#### Scenario: Membership or member loading fails

- GIVEN a household membership, household, or member read fails
- WHEN the failure is received
- THEN `useHogar` exposes `error` with the failure available to the consumer
- AND it does not expose `sin-hogar` as the result.

### Requirement: Provider-owned, household-scoped resources

One household provider MUST be the sole owner of the memoized household-scoped collections and the realtime subscription used by the application hooks. It MUST expose derived household state and supported actions, not the raw collections or SDK client. The provider MUST initialize those resources only while `useHogar` is `ready`, and every resource instance MUST be scoped to the resolved household.

#### Scenario: Consumers receive projections rather than storage handles

- GIVEN a consumer uses `useHogar`, `useListas`, or `useArticulos`
- WHEN the hook returns its public value
- THEN the value contains only documented derived state, errors, and typed actions
- AND it contains no raw collection, transaction, SDK, or realtime-subscription handle.

#### Scenario: Household isolation applies to shared resources

- GIVEN two different households can be resolved in succession
- WHEN the provider is ready for the second household
- THEN its projections and realtime events are scoped only to the second household
- AND records or events from the first household cannot appear in the second household's projections.

### Requirement: Realtime lifecycle and error visibility

The provider MUST register realtime handlers before connecting. It MUST surface a realtime connection or subscription failure through the public error state; it MUST NOT silently report a successful ready lifecycle when subscription establishment fails. Cleanup MUST symmetrically remove handlers and end the subscription before resources are discarded. The provider MUST maintain at most one active subscription for its current household.

#### Scenario: Subscription setup succeeds

- GIVEN `useHogar` is ready for a household
- WHEN the provider establishes realtime
- THEN handlers are registered before connection is started
- AND exactly one active subscription exists for that household.

#### Scenario: Realtime subscription fails

- GIVEN household resolution is ready
- WHEN connection or subscription returns or emits an error
- THEN the provider exposes that error to consumers
- AND it does not create a duplicate replacement subscription implicitly.

#### Scenario: Unmount cleans up external resources

- GIVEN the provider has an active subscription
- WHEN the provider unmounts
- THEN its handlers and subscription are cleaned up
- AND no active subscription remains from that provider instance.

### Requirement: Strict Mode and session/household transitions are safe

The lifecycle MUST tolerate React Strict Mode's development setup-cleanup-setup sequence and MUST mirror every setup with cleanup. On a session change, sign-out, or resolved household change, it MUST stop the prior household's realtime/resource lifecycle before making the new scope observable. Stale reads, callbacks, and events from a prior session or household MUST NOT overwrite the current public state.

#### Scenario: Strict Mode does not leave duplicate subscriptions

- GIVEN React runs the provider effect as setup, cleanup, and setup in development Strict Mode
- WHEN the second setup completes
- THEN exactly one subscription for the current household is active
- AND the first setup's subscription and handlers have been removed.

#### Scenario: Session changes while prior resources are active

- GIVEN the provider is ready for household A and has an active subscription
- WHEN the authenticated session changes to one resolving household B
- THEN household A resources are cleaned up before B becomes ready
- AND a late A callback or event cannot change B's state or projections.

## Out of Scope

This specification does not require bootstrap or household provisioning, backend migrations/functions/bulk endpoints, UI or routes, offline mutation queues, direct raw-collection access, or any custom client-side self-echo deduplication.
