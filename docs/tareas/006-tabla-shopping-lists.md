# 006 — Crear la tabla `shopping_lists`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [004](004-tabla-households.md) |
| **Bloquea a** | 007 |

## Objetivo

Las listas con nombre del hogar.

## Pasos

- [ ] Aplicar el DDL con `household_id`, `name` y auditoría.
- [ ] Añadir `CONSTRAINT shopping_lists_id_household UNIQUE (id, household_id)`.

## Hecho cuando

- La tabla existe y tiene la restricción única sobre `(id, household_id)`.

## Ojo con esto

Ese `UNIQUE (id, household_id)` parece redundante sobre una clave primaria, y **no lo es**: es lo
único que permite que la tarea 007 declare una clave ajena compuesta contra él. Sin esta línea, la
siguiente tarea no se puede hacer.
