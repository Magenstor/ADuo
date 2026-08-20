# 014 — Políticas de miembro del hogar

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | [005](005-tabla-household-members.md), [013](013-habilitar-rls.md) |
| **Bloquea a** | 016 |

## Objetivo

La única regla de privacidad del producto, escrita una vez y aplicada igual en todas partes.

## Pasos

- [x] Política para `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre las cuatro tablas de datos: `household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())`.
- [x] Política de `household_members`: un miembro ve a los miembros de sus hogares.

## Hecho cuando

- Los cuatro verbos están cubiertos en las cuatro tablas.

## Ojo con esto

**La regla natural provoca recursión infinita.** Escribir
`household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())`
en la política de `household_members` hace que esa política consulte `household_members`, cuya
política vuelve a consultarla. Postgres corta con un error y la tabla queda inaccesible.

La salida es una función `SECURITY DEFINER`, que corre con los permisos del dueño y **no aplica
RLS**, rompiendo el ciclo. Marcada `STABLE`, además, Postgres la evalúa una vez por sentencia en
lugar de una vez por fila.

Cubrir solo `SELECT` es el error habitual: dejaría a cualquiera **escribir** en el hogar ajeno
aunque no pueda leerlo.

## Resultado (20 de agosto de 2026)

Políticas de miembro en los cuatro verbos. **Hizo falta la función `hogares_del_usuario()`** — ver el aviso.
