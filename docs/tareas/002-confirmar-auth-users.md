# 002 — Confirmar la tabla de usuarios

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | — |
| **Bloquea a** | 005, 007 |

## Objetivo

Saber a qué apuntan las claves ajenas antes de escribir una sola tabla.

## Pasos

- [x] Listar las columnas de `auth.users`.

## Hecho cuando

- `auth.users(id uuid)` existe, así que las FK del esquema funcionan tal como están escritas.
- Anotado que trae `email`, `email_verified` y un `profile jsonb` con `name` y `avatar_url`.

## Ojo con esto

El enlace con el proveedor vive aparte, en `auth.user_providers`. Nuestras FK apuntan a `auth.users.id`, que es estable.
