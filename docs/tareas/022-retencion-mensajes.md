# 022 — Fijar la retención de `realtime.messages`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · Realtime |
| **Depende de** | [021](021-bloquear-publish.md) |
| **Bloquea a** | — |

## Objetivo

Limitar cuánto tiempo vive la segunda copia de nuestros datos privados.

## Pasos

- [ ] Fijar `retention_days` en `realtime.config` a un valor corto.
- [ ] Comprobar que la limpieza diaria de pg_cron está activa.

## Hecho cuando

- `retention_days` tiene un valor corto y explícito, no `NULL`.

## Ojo con esto

⚠️ **Los payloads se persisten.** El texto de los artículos acaba duplicado en `realtime.messages`,
que es una segunda copia de datos privados con sus propias reglas. Nuestro modelo dice que los datos
solo los ven los miembros del hogar: eso tiene que valer también aquí.

`NULL` significa guardar para siempre.
