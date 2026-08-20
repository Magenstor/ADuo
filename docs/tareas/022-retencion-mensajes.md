# 022 — Fijar la retención de `realtime.messages`

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · Realtime |
| **Depende de** | [021](021-bloquear-publish.md) |
| **Bloquea a** | — |

## Objetivo

Limitar cuánto tiempo vive la segunda copia de nuestros datos privados.

## Pasos

- [x] Fijar `retention_days` en `realtime.config` a un valor corto.
- [x] Comprobar que la limpieza diaria de pg_cron está activa.

## Hecho cuando

- `retention_days` tiene un valor corto y explícito, no `NULL`.

## Ojo con esto

⚠️ **Los payloads se persisten.** El texto de los artículos acaba duplicado en `realtime.messages`,
que es una segunda copia de datos privados con sus propias reglas. Nuestro modelo dice que los datos
solo los ven los miembros del hogar: eso tiene que valer también aquí.

`NULL` significa guardar para siempre.

## Resultado (20 de agosto de 2026)

**`retention_days = 7`**, verificado leyendo `realtime.config` después de fijarlo.

**No se puede hacer desde SQL:** `UPDATE realtime.config` devuelve `permission denied for table config` incluso como administrador. La vía es `PATCH /api/realtime/config` con un token de admin, y el campo del cuerpo se llama **`retentionDays`** en camelCase, no `retention_days`:

```bash
curl --request PATCH --url "$URL/api/realtime/config" \
  --header "Authorization: Bearer $ADMIN_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"retentionDays": 7}'
```

Antes estaba en `NULL`, que significa **guardar para siempre** — y los payloads llevan el texto de los artículos.
