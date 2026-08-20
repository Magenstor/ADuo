# 020 — RLS de suscripción al canal

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · Realtime |
| **Depende de** | [017](017-canal-hogar.md) |
| **Bloquea a** | 023 |

## Objetivo

Que solo se pueda escuchar el canal del hogar propio.

## Pasos

- [x] Política `SELECT` sobre `realtime.channels` que use `realtime.channel_name()` para extraer el uuid y comprobar la pertenencia en `household_members`.
- [x] `ALTER TABLE realtime.channels ENABLE ROW LEVEL SECURITY`.

## Hecho cuando

- Un usuario ajeno no puede suscribirse al canal de nuestro hogar.

## Ojo con esto

**El realtime está abierto por defecto:** `anon` y `authenticated` pueden suscribirse a cualquier
canal habilitado. Sin esta tarea, cualquiera con la anon key escucha la lista de la compra de
cualquier hogar.

Se usa `realtime.channel_name()` y no `pattern` porque la tabla guarda el patrón (`household:%`)
mientras que el cliente pide un canal resuelto (`household:<uuid>`).

## Resultado (20 de agosto de 2026)

Política `SELECT` sobre `realtime.channels` con `realtime.channel_name()`. **Sin esto el realtime está abierto por defecto.**
