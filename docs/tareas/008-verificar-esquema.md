# 008 — Verificar el esquema aplicado

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | [004](004-tabla-households.md), [005](005-tabla-household-members.md), [006](006-tabla-shopping-lists.md), [007](007-tabla-shopping-items.md) |
| **Bloquea a** | 013 |

## Objetivo

Comprobar que lo aplicado es lo diseñado, antes de construir encima.

## Pasos

- [x] Llamar a `get-table-schema` para las cuatro tablas.
- [x] Contrastar columnas, tipos, claves ajenas y restricciones contra `05-Esquema-BD.md`.

## Hecho cuando

- Las cuatro tablas coinciden con el documento.
- Si algo difiere, se corrige el documento o el esquema — pero no se sigue con una discrepancia.

## Resultado (20 de agosto de 2026)

Esquema verificado **provocando las violaciones**, no leyendo definiciones. Ver `backend/migrations/README.md`.
