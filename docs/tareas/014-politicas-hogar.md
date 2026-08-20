# 014 — Políticas de miembro del hogar

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [005](005-tabla-household-members.md), [013](013-habilitar-rls.md) |
| **Bloquea a** | 016 |

## Objetivo

La única regla de privacidad del producto, escrita una vez y aplicada igual en todas partes.

## Pasos

- [ ] Política para `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre las cuatro tablas de datos: `household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())`.
- [ ] Política de `household_members`: un miembro ve a los miembros de sus hogares.

## Hecho cuando

- Los cuatro verbos están cubiertos en las cuatro tablas.

## Ojo con esto

Cubrir solo `SELECT` es el error habitual: dejaría a cualquiera **escribir** en el hogar ajeno
aunque no pueda leerlo.
