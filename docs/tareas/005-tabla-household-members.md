# 005 — Crear la tabla `household_members`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [002](002-confirmar-auth-users.md), [004](004-tabla-households.md) |
| **Bloquea a** | 014, 025 |

## Objetivo

La tabla de pertenencia. Es la que sostiene la única regla de seguridad del producto.

## Pasos

- [ ] Aplicar el DDL con PK uuid propia, `household_id`, `user_id`, `display_name`.
- [ ] Añadir `UNIQUE (household_id, user_id)`.

## Hecho cuando

- La tabla existe y no admite al mismo usuario dos veces en el mismo hogar.

## Ojo con esto

La PK es **uuid propia y no compuesta** `(household_id, user_id)`, y no es capricho:
`audit_log.row_id` es un solo uuid por fila. Con PK compuesta no habría nada que guardar ahí.
