# 023 — Capturar la forma exacta de los eventos

| | |
|---|---|
| **Estado** | pendiente |
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
