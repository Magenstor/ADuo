# 006 — Crear la tabla `shopping_lists`

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | [004](004-tabla-households.md) |
| **Bloquea a** | 007 |

## Objetivo

Las listas con nombre del hogar.

## Pasos

- [x] Aplicar el DDL con `household_id`, `name` y auditoría.
- [x] Añadir `CONSTRAINT shopping_lists_id_household UNIQUE (id, household_id)`.

## Hecho cuando

- La tabla existe y tiene la restricción única sobre `(id, household_id)`.

## Ojo con esto

Ese `UNIQUE (id, household_id)` parece redundante sobre una clave primaria, y **no lo es**: es lo
único que permite que la tarea 007 declare una clave ajena compuesta contra él. Sin esta línea, la
siguiente tarea no se puede hacer.

## Resultado (20 de agosto de 2026)

`shopping_lists` creada **con** `UNIQUE (id, household_id)`, sin la cual la 007 no se podría aplicar. Migración `003_shopping_lists.sql`.
