# Listas Refetch Specification

## Purpose

Recover from a dropped realtime connection by forcing a refetch on window-focus regain and on reconnect, so the collections do not keep showing a silent stale past despite the high `staleTime` set by `listas-collections`.

## Requirements

### Requirement: Refetch actually occurs on window focus regain

Both `listasCollection` and `articulosCollection` MUST be configured so that regaining window focus triggers a refetch of that collection's data, regardless of whether the collection's `staleTime` window has elapsed. This MUST use the collection option value that forces the refetch unconditionally (`'always'`), not the value that only refetches when the query is already considered stale (`true`), since the high `staleTime` from `listas-collections` would otherwise keep the query "not stale" and make `true` a silent no-op.

#### Scenario: A focus event forces a refetch inside the stale window

- GIVEN a collection whose `staleTime` has not yet elapsed since its last successful load
- WHEN the browser `window` dispatches a `visibilitychange`/focus regain recognized by TanStack Query as focus regain
- THEN the collection's `queryFn` is invoked again as a direct result of that event
- AND this occurs even though the query was not otherwise due for a refetch

#### Scenario: No focus event means no extra refetch

- GIVEN a collection whose `staleTime` has not yet elapsed
- WHEN no focus-regain event occurs
- THEN the `queryFn` is not invoked again beyond its initial load

### Requirement: Refetch actually occurs on reconnect

Both collections MUST be configured so that the browser regaining network connectivity triggers a refetch, using the unconditional value (`'always'`) rather than the staleness-gated default (`true`), for the same reason as focus regain.

#### Scenario: An online event forces a refetch inside the stale window

- GIVEN a collection whose `staleTime` has not yet elapsed since its last successful load
- WHEN the browser dispatches an `online` event recognized by TanStack Query as reconnect
- THEN the collection's `queryFn` is invoked again as a direct result of that event
- AND this occurs even though the query was not otherwise due for a refetch

### Requirement: Returning after a dropped connection shows up-to-date data

After a realtime disconnect during which server-side changes occurred, regaining focus or reconnecting MUST result in the collection reflecting those changes, even though the realtime channel itself does not replay missed events.

#### Scenario: Data missed while disconnected appears after reconnect

- GIVEN the realtime connection was dropped while a change was made on another device
- AND that change was never delivered because the socket was down
- WHEN the browser reconnects and the resulting refetch resolves
- THEN the collection reflects the change made on the other device
