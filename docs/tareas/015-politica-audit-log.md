# 015 — Blindar `audit_log`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [013](013-habilitar-rls.md) |
| **Bloquea a** | 016 |

## Objetivo

Que el registro sea legible por los miembros y no lo pueda tocar nadie.

## Pasos

- [ ] Política de `SELECT` para los miembros del hogar.
- [ ] **Ninguna** política de `INSERT`, `UPDATE` ni `DELETE`, para nadie.

## Hecho cuando

- Un miembro puede leer la auditoría de su hogar.
- Nadie puede escribirla, modificarla ni borrarla, ni siquiera la suya.

## Ojo con esto

Es el criterio de aceptación 14. Un registro de auditoría que se puede editar no sirve para nada.
