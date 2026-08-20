# 023 — Capturar la forma exacta de los eventos

| | |
|---|---|
| **Estado** | ⛔ bloqueada |
| **Bloque** | Backend · Realtime |
| **Depende de** | [019](019-triggers-publicacion.md), [020](020-rls-suscripcion.md), [021](021-bloquear-publish.md) |
| **Bloquea a** | 044 |

## Objetivo

Saber qué llega de verdad antes de escribir el traductor del frontend.

## Pasos

- [ ] Suscribirse al canal del hogar desde un script mínimo.
- [ ] Provocar un insert, un update y un delete.
- [ ] Anotar los nombres de campo del payload y qué viene dentro de `meta`.

## Hecho cuando

- Está anotada la forma real de los tres eventos.
- Con eso se puede escribir la tarea 044 sin adivinar.

## Ojo con esto

Un script mínimo, sin arquitectura. Esto es un spike, no código de producción.

## Por qué está bloqueada (20 de agosto de 2026)

**Necesita un cliente conectado por Socket.IO.** Lo que sí está capturado es la forma del lado del servidor, verificada en la tarea 019:

| Evento | Canal | Payload |
|---|---|---|
| `list.insert` / `list.update` / `list.delete` | `household:<uuid>` | La fila entera en `jsonb` |
| `item.insert` / `item.update` / `item.delete` | `household:<uuid>` | La fila entera en `jsonb` |

Falta ver qué añade el SDK en `meta` al recibirlo. Se hace junto con la tarea [044](044-realtime-direct-writes.md).

**Procedimiento paso a paso, con los comandos listos:** [`../06-Pruebas-tras-el-primer-login.md`](../06-Pruebas-tras-el-primer-login.md).
