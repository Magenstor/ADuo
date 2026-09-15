# Proposal: Household and Shopping Application Hooks

## Intent
Complete tasks 047–048 so future screens can access household membership and manage shared shopping without knowing InsForge, raw collections, or business calculations. Existing domain, repositories, collections, and realtime translation lack an application boundary.

## Scope
### In Scope
- `useHogar`: household, members, loading/error states; zero memberships means `sin-hogar`, multiple memberships mean configuration error.
- One household provider owning memoized collections and one realtime subscription.
- `useListas`: create, rename, delete.
- `useArticulos`: list-filtered articles; add, edit, mark/unmark, delete, clear bought.
- Derived arrays/states, typed actions, optimistic updates, persistence outcomes, and rollback tests.

### Out of Scope
Bootstrap/provisioning; backend migrations, functions, or bulk endpoints; UI/routes; offline queues; custom self-echo deduplication.

## Capabilities
### New Capabilities
- `household-context`: membership resolution and shared household resource lifecycle.
- `shopping-application-hooks`: list/article projections and typed optimistic actions.

### Modified Capabilities
None identified in supplied exploration; preserve existing domain and realtime contracts.

## Approach
Load household/members through the SDK with explicit data/error handling. Keep collections private; derive projections through `useLiveQuery`. Await transaction persistence and surface failures. Register realtime handlers before connecting, handle subscription errors, and mirror setup with cleanup across Strict Mode, session changes, and unmount.

Client UUIDs/timestamps are provisional; server/realtime is authoritative with last-write-wins. Deleting a list removes children optimistically in memory without child persistence deletes; failure must restore consistent visibility. Clear-bought aggregates independent outcomes into successful/failed IDs, retaining successful deletes and restoring failed ones.

## Affected Areas
| Area | Impact |
|---|---|
| `shared/hogar/` | New cross-cutting household context/provider/hook and tests |
| Shopping application layer | New list/article hooks and tests; exact paths settled in design |
| Existing collections/realtime boundary | Minimal lifecycle/optimistic integration only if required |

## Risks
- Duplicate subscriptions or stale household data: test cleanup, isolation, and Strict Mode.
- Cascade rollback and concurrent echoes: retain server authority; validate memory-only child removal.
- Partial deletion hidden as success: return explicit per-ID outcomes.
- Scope may exceed 600 authored changed lines: forecast before apply; no implicit size exception or chaining.

## Rollback Plan
Revert application hooks/provider and narrowly scoped integration changes. No schema or data migration requires reversal; already persisted user mutations remain authoritative.

## Dependencies
Existing session, domain, repositories, collections, realtime, and server cascade behavior. Inputs: explore #514 r2, research #516 r3 (C1–C6), confirmed preproposal #515 r5. Auto execution; single PR; 600-line budget; Engram only; no repository writes in this phase.

## Success Criteria
- Membership cardinality and errors are explicit.
- Consumers need neither SDK nor raw collections.
- All actions expose persistence outcomes and correct rollback.
- List deletion and clear-bought satisfy confirmed semantics.
- Lifecycle tests prove one active subscription and household isolation.
