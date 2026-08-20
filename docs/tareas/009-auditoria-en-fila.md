# 009 — Auditoría en la fila: `set_auditoria()` y sus triggers

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | [008](008-verificar-esquema.md) |
| **Bloquea a** | 012 |

## Objetivo

Registrar quién creó y quién modificó cada fila, sin fiarse del cliente.

## Pasos

- [ ] Crear la función `set_auditoria()` que rellena `updated_at` y `updated_by := auth.uid()`.
- [ ] Crear el trigger `BEFORE INSERT OR UPDATE` en las cuatro tablas.

## Hecho cuando

- Modificar una fila actualiza `updated_at` y `updated_by` sin que el cliente mande nada.

## Ojo con esto

**El cliente no manda nunca `updated_by`.** Si pudiera mandarlo, podría mentir — y una auditoría en
la que se puede mentir no es una auditoría, es decoración.
