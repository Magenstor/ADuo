# 008 — Verificar el esquema aplicado

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [004](004-tabla-households.md), [005](005-tabla-household-members.md), [006](006-tabla-shopping-lists.md), [007](007-tabla-shopping-items.md) |
| **Bloquea a** | 013 |

## Objetivo

Comprobar que lo aplicado es lo diseñado, antes de construir encima.

## Pasos

- [ ] Llamar a `get-table-schema` para las cuatro tablas.
- [ ] Contrastar columnas, tipos, claves ajenas y restricciones contra `05-Esquema-BD.md`.

## Hecho cuando

- Las cuatro tablas coinciden con el documento.
- Si algo difiere, se corrige el documento o el esquema — pero no se sigue con una discrepancia.
