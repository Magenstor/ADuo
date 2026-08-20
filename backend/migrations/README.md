# Migraciones

SQL aplicado al proyecto de InsForge, en orden. Cada archivo se aplica una vez y no se reescribe:
si algo cambia, se anade una migracion nueva.

| # | Archivo | Tarea |
|---|---|---|
| 001 | `001_households.sql` | [004](../../docs/tareas/004-tabla-households.md) |
| 002 | `002_household_members.sql` | [005](../../docs/tareas/005-tabla-household-members.md) |
| 003 | `003_shopping_lists.sql` | [006](../../docs/tareas/006-tabla-shopping-lists.md) |
| 004 | `004_shopping_items.sql` | [007](../../docs/tareas/007-tabla-shopping-items.md) |
| 005 | `005_auditoria_en_fila.sql` | [009](../../docs/tareas/009-auditoria-en-fila.md) |
| 006 | `006_audit_log.sql` | [010](../../docs/tareas/010-tabla-audit-log.md), [011](../../docs/tareas/011-trigger-auditoria.md) |
| 007 | `007_seguridad_de_fila.sql` | [013](../../docs/tareas/013-habilitar-rls.md), [014](../../docs/tareas/014-politicas-hogar.md), [015](../../docs/tareas/015-politica-audit-log.md) |
| 008 | `008_realtime.sql` | [017](../../docs/tareas/017-canal-hogar.md) a [021](../../docs/tareas/021-bloquear-publish.md) |

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

## Verificacion de auditoria y realtime (2026-08-20, tareas 012 y 018-021)

Misma tecnica: provocar el comportamiento dentro de una transaccion abortada.

| Comprobacion | Resultado |
|---|---|
| INSERT auditados | 5 apuntes: hogar, lista y 3 articulos |
| `created_at` inmutable | Un UPDATE que intenta reescribirlo no lo consigue |
| UPDATE auditado | 1 apunte con `old_data` y `new_data` |
| Cascade auditado | 4 apuntes al borrar la lista: ella y sus 3 articulos |
| `old_data` respalda | Conserva `content = 'leche'` del articulo borrado |
| Realtime publica | 5 mensajes: `list.insert`, `item.insert`, `item.update`, `list.delete`, `item.delete` |
| Canal por hogar | Todos en `household:<uuid>` del hogar correcto |
| Payload de borrado | Trae `id` y `content`, que es lo que necesita un direct write |

Tras cada prueba: 0 filas en todas las tablas y las 8 columnas de auditoria de vuelta en `NOT NULL`.

## Dos hallazgos del orden de los eventos

**El cascade publica `list.delete` ANTES que `item.delete`.** El cliente recibira primero el borrado
de la lista y despues el de cada articulo que ya habra quitado. El traductor de la tarea 044 tiene
que tolerar un `writeDelete` sobre una clave que ya no existe.

**`actor_id` de `audit_log` es NULLABLE**, y es un cambio deliberado sobre el diseno original.
`auth.uid()` devuelve `NULL` en consulta de administrador, asi que un `NOT NULL` haria fallar toda
operacion de consola. `NULL` significa "no lo hizo un usuario". Un registro que se niega a anotar una
accion es peor que uno que anota "no se quien fue".
