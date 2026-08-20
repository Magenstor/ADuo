# 017 — Crear el patrón de canal `household:%`

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · Realtime |
| **Depende de** | [008](008-verificar-esquema.md) |
| **Bloquea a** | 018, 020 |

## Objetivo

Un canal por hogar. Es lo que convierte el filtrado por hogar en algo que no hay que programar.

## Pasos

- [x] `INSERT INTO realtime.channels (pattern, description, enabled) VALUES ('household:%', ..., true)`.

## Hecho cuando

- El patrón existe y está habilitado.

## Ojo con esto

InsForge **no** hace streaming automático de cambios de tabla. No existe "suscríbete a
`shopping_items`". Es pub/sub sobre canales con nombre, y los eventos de base de datos los
publicamos nosotros.

Los patrones usan `LIKE` de SQL con `:` de separador y `%` de comodín. **No usar `_`**, que en `LIKE`
es un comodín de un carácter.

## Resultado (20 de agosto de 2026)

Patrón `household:%` creado y habilitado. Migración `008_realtime.sql`.
