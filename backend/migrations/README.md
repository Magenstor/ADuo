# Migraciones

SQL aplicado al proyecto de InsForge, en orden. Cada archivo se aplica una vez y no se reescribe:
si algo cambia, se anade una migracion nueva.

| # | Archivo | Tarea |
|---|---|---|
| 001 | `001_households.sql` | [004](../../docs/tareas/004-tabla-households.md) |
| 002 | `002_household_members.sql` | [005](../../docs/tareas/005-tabla-household-members.md) |
| 003 | `003_shopping_lists.sql` | [006](../../docs/tareas/006-tabla-shopping-lists.md) |
| 004 | `004_shopping_items.sql` | [007](../../docs/tareas/007-tabla-shopping-items.md) |

## Por que existe esta carpeta

El DDL se aplica con `run-raw-sql` contra la base de datos en vivo, y eso **no deja ningun rastro
versionado de lo que se aplico**. Sin estos archivos, el esquema real solo existiria dentro de
InsForge y la unica forma de saber que hay seria preguntarselo. Aqui queda reproducible.

## Verificacion aplicada (2026-08-20, tarea 008)

Las restricciones no se comprobaron leyendo su definicion, sino **provocando las violaciones** dentro
de una transaccion abortada a proposito, que se revierte sola:

| Invariante | Resultado |
|---|---|
| FK compuesta `(list_id, household_id)` | Rechaza un articulo cuyo hogar no es el de su lista |
| `comprado_coherente` | Rechaza `is_bought = true` sin `bought_at` ni `bought_by` |
| `CHECK` de nombre | Rechaza un nombre formado solo por espacios |
| `ON DELETE CASCADE` | Borrar una lista se llevo sus 3 articulos |

Tras la prueba: 0 filas en las tres tablas y las 8 columnas de auditoria de vuelta en `NOT NULL`.

## Aviso para la tarea 024

`created_by` y `updated_by` son `NOT NULL DEFAULT auth.uid()`, y **`auth.uid()` devuelve `NULL` en
una consulta de administrador**. Por eso no se puede crear el hogar inicial con SQL crudo desde la
consola antes de que exista ningun usuario: el `NOT NULL` lo rechaza.

Las dos salidas: crear el hogar **despues** del primer login, o pasar `created_by` explicito con el
id de un usuario que ya exista.
