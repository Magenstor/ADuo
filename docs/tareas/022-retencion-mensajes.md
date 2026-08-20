# 022 — Fijar la retención de `realtime.messages`

| | |
|---|---|
| **Estado** | ⛔ bloqueada |
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

## Por qué está bloqueada (20 de agosto de 2026)

**No se puede hacer desde SQL.** `UPDATE realtime.config SET retention_days = 7` devuelve `permission denied for table config` incluso como administrador.

Hay que hacerlo desde el **Dashboard → Realtime → Settings**, o con `PATCH /api/realtime/config` y un token de admin.

⚠️ Ahora mismo `retention_days` está en **`NULL`, que significa guardar para siempre**. Y los payloads llevan el texto de los artículos.
