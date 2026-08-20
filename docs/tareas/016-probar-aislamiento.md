# 016 — Probar el aislamiento con dos usuarios de verdad

| | |
|---|---|
| **Estado** | ⛔ bloqueada |
| **Bloque** | Backend · InsForge |
| **Depende de** | [014](014-politicas-hogar.md), [015](015-politica-audit-log.md) |
| **Bloquea a** | 024 |

## Objetivo

Demostrar que un usuario de otro hogar no llega a nuestras filas. Criterio de aceptación 12.

## Pasos

- [ ] Crear un segundo hogar con otra cuenta.
- [ ] Intentar leer nuestras filas desde esa cuenta.
- [ ] Intentar insertar, actualizar y borrar en nuestro hogar desde esa cuenta.
- [ ] Intentar leer nuestro `audit_log`.

## Hecho cuando

- Los cuatro verbos fallan desde el hogar ajeno.
- La auditoría ajena tampoco se lee.

## Ojo con esto

**Probarlo con un solo usuario no demuestra nada.** Con una sola cuenta, una política mal escrita
que devuelve todo se ve exactamente igual que una correcta.

## Por qué está bloqueada (20 de agosto de 2026)

**Necesita dos usuarios reales.** No hay ninguno en `auth.users`: nadie ha entrado todavía. Se hace después de la tarea [036](036-login-google.md).

Las políticas están escritas y verificadas estructuralmente (RLS activo en las cinco tablas, `audit_log` con solo `SELECT`), pero **probar el aislamiento con un solo usuario no demuestra nada**, y con cero, menos.

**Procedimiento paso a paso, con los comandos listos:** [`../06-Pruebas-tras-el-primer-login.md`](../06-Pruebas-tras-el-primer-login.md).
