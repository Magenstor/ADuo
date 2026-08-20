# 009 — Auditoría en la fila: `set_auditoria()` y sus triggers

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | [008](008-verificar-esquema.md) |
| **Bloquea a** | 012 |

## Objetivo

Registrar quién creó y quién modificó cada fila, sin fiarse del cliente.

## Pasos

- [x] Crear la función `set_auditoria()` que rellena `updated_at` y `updated_by := auth.uid()`.
- [x] Crear el trigger `BEFORE INSERT OR UPDATE` en las cuatro tablas.

## Hecho cuando

- Modificar una fila actualiza `updated_at` y `updated_by` sin que el cliente mande nada.

## Ojo con esto

**El cliente no manda nunca `updated_by`.** Si pudiera mandarlo, podría mentir — y una auditoría en
la que se puede mentir no es una auditoría, es decoración.

## Resultado (20 de agosto de 2026)

Función `set_auditoria()` y trigger `BEFORE INSERT OR UPDATE` en las cuatro tablas. Migración `005_auditoria_en_fila.sql`. **Además impone que `created_at`/`created_by` sean inmutables:** un UPDATE ya no los puede reescribir, probado en la tarea 012.
