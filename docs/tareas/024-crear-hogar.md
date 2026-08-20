# 024 — Crear el hogar y su lista inicial

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · Datos iniciales |
| **Depende de** | [016](016-probar-aislamiento.md) |
| **Bloquea a** | 025 |

## Objetivo

Que la aplicación no arranque vacía.

## Pasos

- [ ] Insertar el hogar.
- [ ] Insertar la lista inicial llamada "La compra".

## Hecho cuando

- Existe un hogar con una lista "La compra".

## Ojo con esto

⚠️ **No se puede hacer con SQL crudo desde la consola mientras no exista ningún usuario.**
`created_by` es `NOT NULL DEFAULT auth.uid()`, y **`auth.uid()` devuelve `NULL` en una consulta de
administrador**, así que el `NOT NULL` rechaza el `INSERT`.

Las dos salidas: crear el hogar **después del primer login** (tarea
[036](036-login-google.md)), o pasar un `created_by` explícito con el id de un usuario que ya exista.

Descubierto al verificar el esquema en la tarea [008](008-verificar-esquema.md).
