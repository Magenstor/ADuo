# 012 — Probar la auditoría y el borrado en cascada

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | [009](009-auditoria-en-fila.md), [011](011-trigger-auditoria.md) |
| **Bloquea a** | 013 |

## Objetivo

Comprobar que el borrado físico no pierde información.

## Pasos

- [x] Crear una lista con tres artículos.
- [x] Borrar la lista.
- [x] Contar los apuntes de `audit_log` y mirar su `old_data`.

## Hecho cuando

- Quedan **cuatro** apuntes: la lista y sus tres artículos.
- Cada uno conserva el contenido íntegro de la fila borrada.

## Ojo con esto

Los borrados en cascada quedan auditados **gratis**: un trigger de fila se dispara una vez por cada
fila que el cascade elimina. Si salen menos de cuatro apuntes, el trigger está mal declarado.

## Resultado (20 de agosto de 2026)

Verificado provocando el comportamiento en una transacción abortada: 5 INSERT auditados, `created_at` inmutable, 1 UPDATE con `old_data`/`new_data`, 4 apuntes al borrar la lista en cascada, y `old_data` conservando `content='leche'`. Ver `backend/migrations/README.md`.
