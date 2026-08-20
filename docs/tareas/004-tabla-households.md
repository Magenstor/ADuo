# 004 — Crear la tabla `households`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [002](002-confirmar-auth-users.md) |
| **Bloquea a** | 005, 006, 007 |

## Objetivo

El hogar es la raíz de todo: de él cuelgan miembros, listas y artículos, y después gastos y bolsas.

## Pasos

- [ ] Aplicar el DDL de `households` del apartado 4.1 de `05-Esquema-BD.md`.
- [ ] Incluir las cuatro columnas de auditoría.

## Hecho cuando

- La tabla existe con `id`, `name` y auditoría.
- No tiene columna `invite_code`: no hay flujo de invitación en el MVP.
