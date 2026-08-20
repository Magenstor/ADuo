# 015 — Blindar `audit_log`

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | [013](013-habilitar-rls.md) |
| **Bloquea a** | 016 |

## Objetivo

Que el registro sea legible por los miembros y no lo pueda tocar nadie.

## Pasos

- [x] Política de `SELECT` para los miembros del hogar.
- [x] **Ninguna** política de `INSERT`, `UPDATE` ni `DELETE`, para nadie.

## Hecho cuando

- Un miembro puede leer la auditoría de su hogar.
- Nadie puede escribirla, modificarla ni borrarla, ni siquiera la suya.

## Ojo con esto

Es el criterio de aceptación 14. Un registro de auditoría que se puede editar no sirve para nada.

## Resultado (20 de agosto de 2026)

`audit_log` con **solo** política de `SELECT`. Verificado: 0 políticas de INSERT, UPDATE y DELETE.
