# 025 — Dar de alta a los miembros a mano

| | |
|---|---|
| **Estado** | ⛔ bloqueada |
| **Bloque** | Backend · Datos iniciales |
| **Depende de** | [005](005-tabla-household-members.md), [024](024-crear-hogar.md) |
| **Bloquea a** | 061 |

## Objetivo

Meter a las dos personas en el hogar. Sin esto no se puede validar nada del tiempo real.

## Pasos

- [ ] Insertar la fila de cada miembro en `household_members` desde la consola de InsForge.
- [ ] Poner el `display_name` de cada uno.

## Hecho cuando

- Hay dos miembros en el hogar.
- Los dos ven las mismas listas al entrar.

## Ojo con esto

No hay flujo de invitación en el MVP: fue una decisión, no un olvido. Construir generar código,
presentarlo, introducirlo, validarlo y regenerarlo para ejecutarlo **una vez en la vida** no compra
nada.

Pero esta fila **no es opcional**: con un solo miembro en el hogar, los criterios de aceptación 3 a 6
—que son la sincronización en tiempo real, la apuesta técnica central del módulo— **no se pueden
probar**. La invitación es prescindible; tener dos miembros de verdad, no.

## Por qué está bloqueada (20 de agosto de 2026)

**Necesita usuarios en `auth.users`.** Se hace tras la tarea [036](036-login-google.md).

**Procedimiento paso a paso, con los comandos listos:** [`../06-Pruebas-tras-el-primer-login.md`](../06-Pruebas-tras-el-primer-login.md).
