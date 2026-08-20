# 044 — Suscripción y traducción a direct writes

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Infraestructura |
| **Depende de** | [023](023-capturar-eventos.md), [043](043-colecciones.md) |
| **Bloquea a** | 045, 047 |

## Objetivo

Aplicar en la colección lo que llega por el canal del hogar.

## Pasos

- [ ] `insforge.realtime.connect()` y `subscribe('household:<uuid>')`.
- [ ] Traducir cada evento a `writeInsert`, `writeUpdate` o `writeDelete`, agrupados en `writeBatch`.
- [ ] Registrar el manejador de `error` del realtime.

## Hecho cuando

- Un cambio hecho en otro dispositivo aparece sin recargar.

## Ojo con esto

**Nunca invalidar la query al recibir un evento.** Invalidar dispara un refetch completo de la tabla
por cada fila que cambia — que es exactamente lo que todo este montaje existe para evitar.

Y el reparto de capas, que es fácil describir mal: **Query hace la carga inicial**, el **WebSocket
aplica los cambios**. TanStack Query no tiene transporte de WebSocket.

## Hallazgo de la tarea 019

**El cascade publica `list.delete` ANTES que `item.delete`.** Verificado el 20 de agosto de 2026.

Vas a recibir primero el borrado de la lista y después el de cada artículo que ya habrás quitado al
procesar el primero. **El traductor tiene que tolerar un `writeDelete` sobre una clave que ya no
existe**, o se te llena la consola de errores en cada borrado de lista.
