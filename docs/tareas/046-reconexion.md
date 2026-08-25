# 046 — Reconexión y refetch

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Infraestructura |
| **Depende de** | [045](045-realtime-direct-writes.md) |
| **Bloquea a** | — |

## Objetivo

Recuperarse de una caída del tiempo real.

## Pasos

- [ ] Refetch de las colecciones al recuperar el foco y al reconectar.

## Hecho cuando

- Volver a la aplicación tras perder conexión muestra los datos al día.

## Ojo con esto

Un WebSocket caído **no reenvía lo que se perdió**. Sin este refetch, la aplicación se queda mostrando un pasado silencioso, que es peor que un error visible.
