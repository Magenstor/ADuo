# 010 — Crear la tabla `audit_log`

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | [008](008-verificar-esquema.md) |
| **Bloquea a** | 011 |

## Objetivo

El registro de solo añadir donde vive la auditoría de borrado.

## Pasos

- [x] Aplicar el DDL de `audit_log`: `id bigserial`, `table_name`, `row_id`, `household_id`, `action`, `actor_id`, `occurred_at`, `old_data`, `new_data`.

## Hecho cuando

- La tabla existe y acepta `jsonb` en `old_data` y `new_data`.

## Ojo con esto

Aquí es donde se resuelve la tensión entre borrado físico y auditoría de borrado: **una fila
borrada no puede guardar quién la borró**, porque se va con sus columnas puestas. Así que el dato
sale de la fila y se guarda fuera. El `old_data` de un DELETE **es** el respaldo de lo borrado.

## Resultado (20 de agosto de 2026)

Tabla `audit_log` con sus dos índices. Migración `006_audit_log.sql`. **`actor_id` quedó NULLABLE** — ver el aviso de abajo.
