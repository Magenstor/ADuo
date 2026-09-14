# Listas Realtime Specification

## Purpose

Subscribe to a household's realtime channel and translate its six events into direct writes on the `listas-collections` collections, without ever triggering a query invalidation and without letting an already-cascaded delete discard concurrent legitimate writes.

## Requirements

### Requirement: Household-parameterized connect and subscribe

`realtime.ts` MUST expose a function that connects to InsForge realtime and subscribes to channel `household:<uuid>`, receiving `householdId` as a parameter rather than resolving it internally. `realtime.ts` MUST NOT import `shared/hogar` or anything outside `domain/` and `shared/api`.

#### Scenario: Subscribing uses the supplied household id

- GIVEN a `householdId` of `"a1b2c3"`
- WHEN the exported subscription function is called with that id
- THEN the realtime client subscribes to channel `"household:a1b2c3"`
- AND no household id is read from any other module

### Requirement: Six-event translation into direct writes

Each of `list.insert`, `list.update`, `list.delete`, `item.insert`, `item.update`, and `item.delete` MUST be translated into a direct write on the matching collection, so that the collection's synced state reflects the event without any query invalidation or refetch.

An `insert` or `update` event MUST be applied with a write that succeeds whether or not the key is already present in the collection's synced state. A write that rejects an already-present key is not acceptable here: the server echoes back the rows this client itself created, and those echoes never byte-match the local optimistic value because the database sets `updated_at` and `updated_by` server-side.

Batching is a consequence of how many rows an event carries, not a requirement in itself. A message carrying a single row MUST produce a single write. `writeBatch` MUST be used where one event implies writes for several keys at once — specifically the `list.delete` cascade — and MUST NOT be introduced around a single write.

#### Scenario: A `list.insert` event lands in the list collection

- GIVEN a `list.insert` message for a list not yet in the collection
- WHEN the message is handled
- THEN `listasCollection`'s synced state contains that list
- AND no query invalidation or refetch is triggered

#### Scenario: A `list.insert` echo for a row this client already inserted does not throw

- GIVEN a list already present in `listasCollection`'s synced state
- AND a `list.insert` message for that same id whose `updated_at` and `updated_by` differ from the stored value
- WHEN the message is handled
- THEN no error is raised
- AND `listasCollection`'s synced state holds the values carried by the message

#### Scenario: An `item.update` event lands in the item collection

- GIVEN an `item.update` message for an existing item
- WHEN the message is handled
- THEN `articulosCollection`'s synced state reflects that item's changed fields
- AND no query invalidation or refetch is triggered

### Requirement: Registered realtime error handler

The subscription setup MUST register a handler for the realtime `error` event.

#### Scenario: A realtime error is observed rather than left unhandled

- GIVEN the subscription has been established
- WHEN the realtime client emits an `error` event
- THEN the registered handler is invoked with that error
- AND no unhandled rejection or thrown error escapes the subscription setup

### Requirement: No query invalidation on any realtime event

Handling any of the six events MUST NOT call `queryClient.invalidateQueries` or any equivalent invalidation for the affected query.

#### Scenario: A batch of events over both entities triggers no invalidation

- GIVEN a spy on `queryClient.invalidateQueries`
- WHEN a `list.update` event and an `item.insert` event are each handled
- THEN `invalidateQueries` is never called as a result of handling either event

### Requirement: Cascade-safe batch membership filtering

Before emitting a `writeDelete`, the translator MUST filter out operations whose key is absent from that collection's confirmed synced state, so that a `list.delete` event followed by `item.delete` events for items already removed by the database's FK cascade (task 019: `list.delete` is published before the corresponding `item.delete` events) neither throws nor discards other legitimate operations queued alongside it. The guard MUST read confirmed synced state, not a presence check that also passes for a not-yet-confirmed optimistic insert.

#### Scenario: A list delete followed by its already-cascaded item deletes does not throw

- GIVEN a list and two of its items exist in their respective collections
- WHEN a `list.delete` event for that list is handled, followed by `item.delete` events for both items (already removed by the cascade)
- THEN handling completes without throwing `DeleteOperationItemNotFoundError`

#### Scenario: A cascade-orphaned delete does not discard a concurrent legitimate write

- GIVEN a list whose `list.delete` event has already cascaded its items out of `articulosCollection`
- AND an unrelated item that a concurrent `item.update` event modifies
- WHEN the orphaned `item.delete` events and the concurrent `item.update` are handled
- THEN the unrelated item's update is applied to the collection
- AND no error discards it as a side effect of the absent-key deletes

Note on mechanism: the translator applies one direct write per message (design D3), so an orphaned `item.delete` and a concurrent `item.update` are never queued in the same `writeBatch`. The only batch the translator builds is the `list.delete` cascade, whose keys are read from confirmed synced state and therefore cannot be absent. The guarantee above holds because of that structure plus the membership guard, not because a mixed batch tolerates an absent key — a mixed batch with an absent key would be discarded whole by the collection library, which is precisely what D3 prevents.

#### Scenario: A guard based on optimistic presence alone is insufficient

- GIVEN an item that has been optimistically inserted into the collection but not yet confirmed by the server (present via `collection.has(key)` but absent from confirmed synced state)
- AND a `item.delete` event arrives for a different, already-cascaded key in the same batch
- WHEN the batch is emitted
- THEN the batch does not throw
- AND the optimistically inserted item's presence is not used to justify emitting the already-cascaded delete

### Requirement: Envelope parsing via one narrow adapter

All events MUST be parsed through one adapter (`filaDesdeMensaje`) that treats a missing key and an explicit `null` value as semantically identical for `bought_by` / `bought_at`, and that does not branch on whether `meta.senderId` is `undefined` or `null`. The adapter MUST spread top-level message fields as row data and MUST exclude the `meta` key from that row data.

#### Scenario: A missing purchase field and an explicit null are treated identically

- GIVEN one message omitting `bought_at` entirely and another message with `bought_at: null`, both otherwise identical
- WHEN each is parsed by `filaDesdeMensaje`
- THEN both produce an `Articulo`-shaped row with `boughtAt: null`

#### Scenario: `meta.senderId` presence does not affect translation

- GIVEN one message with `meta.senderId` absent and another with `meta.senderId: null`
- WHEN each is parsed by `filaDesdeMensaje`
- THEN both produce the same row data, independent of `senderId`
