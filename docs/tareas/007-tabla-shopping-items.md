# 007 — Crear la tabla `shopping_items`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [002](002-confirmar-auth-users.md), [006](006-tabla-shopping-lists.md) |
| **Bloquea a** | 019 |

## Objetivo

Los artículos. Aquí está el truco que hace que la base de datos se defienda sola.

## Pasos

- [ ] Aplicar el DDL con `household_id` desnormalizado, `list_id`, `text`, `is_bought`, `bought_at`, `bought_by`.
- [ ] Declarar la FK compuesta `(list_id, household_id) → shopping_lists (id, household_id)` con `ON DELETE CASCADE`.
- [ ] Añadir el `CHECK comprado_coherente`.

## Hecho cuando

- Un artículo no puede colgar de una lista de otro hogar: lo impide la base de datos, no el código.
- Desmarcar un artículo deja `bought_at` y `bought_by` vacíos, o la fila se rechaza.

## Ojo con esto

El `household_id` está duplicado **a propósito**, para que la regla de seguridad sea idéntica en las
cuatro tablas. El agujero que abre esa duplicación —un artículo cuyo hogar no coincide con el de su
lista— lo cierra la FK compuesta de forma declarativa. Sin trigger y sin código.
