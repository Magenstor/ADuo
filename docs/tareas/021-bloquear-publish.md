# 021 — Bloquear la publicación desde el cliente

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · Realtime |
| **Depende de** | [020](020-rls-suscripcion.md) |
| **Bloquea a** | 023 |

## Objetivo

Que solo el trigger pueda publicar.

## Pasos

- [x] `ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY`.
- [x] **Ninguna** política de `INSERT` para `authenticated` ni `anon`.

## Hecho cuando

- Un cliente no puede publicar en ningún canal.

## Ojo con esto

Si el cliente pudiera publicar, podría **inyectar en la pantalla del otro un cambio que nunca pasó
por la base de datos ni por RLS**. Las escrituras van por PostgREST a la tabla; el trigger publica;
el evento vuelve. En ese orden, siempre.

## Resultado (20 de agosto de 2026)

`realtime.messages` con RLS y **sin política de INSERT**. El cliente no puede publicar.
