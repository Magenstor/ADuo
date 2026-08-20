# 019 — Triggers de publicación en listas y artículos

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · Realtime |
| **Depende de** | [007](007-tabla-shopping-items.md), [018](018-funcion-publicar.md) |
| **Bloquea a** | 023 |

## Objetivo

Que cada cambio real acabe en el canal del hogar.

## Pasos

- [ ] Trigger en `shopping_lists` con los eventos `list.insert`, `list.update`, `list.delete`.
- [ ] Trigger en `shopping_items` con `item.insert`, `item.update`, `item.delete`.

## Hecho cuando

- Cambiar una fila publica un mensaje con el nombre de evento correcto.
