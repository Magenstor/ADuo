# 018 — Función `publicar_cambio()`

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · Realtime |
| **Depende de** | [017](017-canal-hogar.md) |
| **Bloquea a** | 019 |

## Objetivo

La costura entre la base de datos y el WebSocket.

## Pasos

- [x] Crear la función `SECURITY DEFINER` que llame a `realtime.publish('household:' || household_id, evento, fila_jsonb)`.
- [x] Contemplar que en `DELETE` el payload sale de `OLD` y no de `NEW`.

## Hecho cuando

- La función publica en el canal del hogar correcto.

## Ojo con esto

El payload lleva **la fila entera en `jsonb`**, porque es lo que necesita un direct write de TanStack DB para insertar o actualizar sin ir a buscar nada más.

## Resultado (20 de agosto de 2026)

Función `publicar_cambio()` `SECURITY DEFINER`. Recibe `'list'` o `'item'` por `TG_ARGV[0]` y compone el evento con `lower(TG_OP)`.
