# Research: InsForge realtime message envelope

**Change**: `infraestructura-datos-realtime`
**Lane**: client-side realtime envelope shape (closes the documentation-reachable part of blocked task 023)
**Date**: 2026-09-12
**Method**: published InsForge documentation only. No repository access, no live client.

## Scope

Three questions the exploration phase could not settle from the installed type declarations alone. Each carries an explicit verdict.

---

## Q1 — `senderType` / `senderId` for trigger-originated events

**Verdict: ANSWERED**

Source: [InsForge TypeScript SDK — Realtime reference](https://docs.insforge.dev/sdks/typescript/realtime.md)

> "senderType is system for database-triggered messages and user for client-published messages."

The same page defines the metadata interface and names database triggers as one of exactly two message origins:

```typescript
interface SocketMessageMeta {
  channel?: string;
  messageId: string;
  senderType: 'system' | 'user';
  senderId?: string;
  timestamp: string;
}
```

> "Database triggers that call realtime.publish(channel, event, payload)"

Corroborating evidence from the [REST realtime reference](https://docs.insforge.dev/sdks/rest/realtime.md) shows a stored system message with `"senderType": "system", "senderId": null` — explicit `null` in the stored/history representation, versus `senderId?: string` (absent/undefined) in the live socket type.

**Consequence for the adapter**: treat `meta.senderType === 'system'` as the expected value for every household-channel event. Do not branch on `meta.senderId`, and tolerate it being either `undefined` or explicitly `null` depending on transport path. Never assume it is a defined string.

---

## Q2 — Extra top-level keys / envelope shape

**Verdict: ANSWERED** (for the live `.on()` delivery path specifically)

Source: [InsForge TypeScript SDK — Realtime reference](https://docs.insforge.dev/sdks/typescript/realtime.md)

The documented usage pattern:

```typescript
interface OrderStatusMessage extends SocketMessage {
  id: string;
  status: string;
}

insforge.realtime.on<OrderStatusMessage>('status_changed', (message) => {
  console.log(message.id);
  console.log(message.status);
  console.log(message.meta.messageId);
});
```

Row fields are accessed directly on `message`; only server metadata is nested, under `message.meta`. No `payload`, `new`, `event`, `channel`, or `type` key appears at the top level of the `.on()` callback argument — `channel` exists only as the optional `meta.channel` sub-field.

This corroborates the exploration's independent finding from the installed `.d.ts` that `socketMessageSchema` is `{ meta } & passthrough` with row fields spread at the top level.

### Adjacent shape that must NOT be conflated

The REST history/audit endpoint (`GET /api/realtime/messages`) documents a different, nested representation:

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "eventName": "status_changed",
  "channelId": "550e8400-e29b-41d4-a716-446655440000",
  "channelName": "order:123",
  "payload": { "id": "123", "status": "shipped" },
  "senderType": "system",
  "senderId": null,
  "wsAudienceCount": 5,
  "whAudienceCount": 1,
  "whDeliveredCount": 1,
  "createdAt": "2026-04-25T17:00:00.000Z"
}
```

This is the history/inspection representation, not the live Socket.IO delivery contract. The client `.on()` callback never sees `eventName`, `channelName`, or the audience counters as siblings of the row fields.

### Flagged discrepancy (inference, not documentation)

A third-party article ([dev.to — "Build a Real-Time Social Media App with InsForge, MiniMax, and Next.js"](https://dev.to/astrodevil/build-a-real-time-social-media-app-with-insforge-minimax-and-nextjs-3jb8)) shows:

```typescript
insforge.realtime.on("INSERT", async (payload) => {
  const newRipple = payload.new as Ripple;
});
```

This `payload.new` shape contradicts both the official SDK reference and the installed `.d.ts`. It is not documentation: the callback parameter is merely *named* `payload` by that author, and `.new` may be a key their own trigger published (mirroring the Postgres `NEW` / `OLD` naming), or the article may be stale. Treated as an unverified inference, explicitly not as counter-evidence to the authoritative reference.

**Consequence for the adapter**: spread all top-level keys except `meta` as row columns. Do not look for, and do not require, a `payload` / `new` wrapper — under the documented flat contract that access would silently yield `undefined`.

---

## Q3 — Null handling for nullable columns

**Verdict: UNRESOLVED**

No page — [Realtime overview](https://docs.insforge.dev/core-concepts/realtime/overview.md), [TypeScript SDK realtime reference](https://docs.insforge.dev/sdks/typescript/realtime.md), [REST realtime reference](https://docs.insforge.dev/sdks/rest/realtime.md) — mentions null stripping, omission, or preservation anywhere in the publish → deliver pipeline. Keyword search of the overview page's raw markdown for "null", "omit", "strip", "JSON.stringify" and "to_jsonb" returned nothing relevant. A GitHub code search for the server-side publish implementation hit an authentication wall.

What is documented is only the trigger authoring pattern ([Realtime overview](https://docs.insforge.dev/core-concepts/realtime/overview.md)):

```sql
PERFORM realtime.publish(
  'order:' || NEW.id::text,
  'status_changed',
  jsonb_build_object('id', NEW.id, 'status', NEW.status, 'updatedAt', NEW.updated_at)
);
```

This confirms the third argument is a `jsonb` value the trigger author builds — in this project, `to_jsonb(row)` — but says nothing about what the transport does with it between the trigger firing and Socket.IO delivery.

**Inference only, not documentation-backed**: standard PostgreSQL semantics for `to_jsonb(row)` preserve SQL `NULL` as explicit JSON `null` rather than dropping the key. If the transport merely passes the `jsonb` value through to `JSON.stringify`, explicit `null` would survive. This rests entirely on general Postgres/JSON behavior and could be falsified by an undocumented intermediate serialization step.

**Consequence for the adapter**: do not assume either behavior. Treat a **missing** key and an **explicit `null`** key as semantically equivalent — both meaning "no value" — for `bought_by` and `bought_at`. Never use mere key presence as a signal.

---

## What `filaDesdeMensaje(mensaje)` must defend against

1. Do not branch on `meta.senderId` presence; accept `undefined` or `null` uniformly as "no sender".
2. Spread all top-level keys except `meta` as row data. Do not require a `payload` / `new` wrapper.
3. Treat a nullable column key as absent-or-null interchangeably; never distinguish "key omitted" from "key present with value `null`" for `bought_by` / `bought_at`.
4. Guard against a literal `meta` key arriving among row columns. The flat-merge contract holds only because no current table names a column `meta`; a future migration could break this silently, and no runtime type check would catch it.

## Residual risks

- Q3 stays unverified against the real wire format. Only an integration test against a live connected client — the original blocker of task 023 — closes it definitively. The defensive mapping above absorbs either outcome.
- The contradicting third-party `payload.new` example was not fully explained. Confidence in Q2 is high but not absolute; if that example reflects current shipping behavior rather than staleness, Q2 would need revisiting.
- Documentation was fetched live and carried no explicit `@insforge/sdk` version marker, so it could lag actual SDK behavior.

## Verdict for the pre-proposal gate

Research lane is `done`. Q1 and Q2 enter design as settled inputs. Q3 enters design as an explicitly absorbed uncertainty, not as a blocker.
