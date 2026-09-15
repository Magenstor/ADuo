# 024 — Crear el hogar y su lista inicial

| | |
|---|---|
| **Estado** | ⛔ bloqueada |
| **Bloque** | Backend · Datos iniciales |
| **Depende de** | [016](016-probar-aislamiento.md) |
| **Bloquea a** | 025 |

## Objetivo

Que la aplicación no arranque vacía.

## Pasos

- [x] Insertar el hogar. (Hecho el 15 de septiembre de 2026 con SQL de administrador: hogar "Casa".)
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

## Por qué está bloqueada (20 de agosto de 2026)

**Necesita un usuario.** `created_by` es `NOT NULL` y `auth.uid()` es `NULL` en consulta de administrador. Se hace tras la tarea [036](036-login-google.md).

**Procedimiento paso a paso, con los comandos listos:** [`../06-Pruebas-tras-el-primer-login.md`](../06-Pruebas-tras-el-primer-login.md).
