# 018 — Función `publicar_cambio()`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · Realtime |
| **Depende de** | [017](017-canal-hogar.md) |
| **Bloquea a** | 019 |

## Objetivo

La costura entre la base de datos y el WebSocket.

## Pasos

- [ ] Crear la función `SECURITY DEFINER` que llame a `realtime.publish('household:' || household_id, evento, fila_jsonb)`.
- [ ] Contemplar que en `DELETE` el payload sale de `OLD` y no de `NEW`.

## Hecho cuando

- La función publica en el canal del hogar correcto.

## Ojo con esto

El payload lleva **la fila entera en `jsonb`**, porque es lo que necesita un direct write de TanStack DB para insertar o actualizar sin ir a buscar nada más.
