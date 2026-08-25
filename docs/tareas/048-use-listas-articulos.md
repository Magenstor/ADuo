# 048 — `useListas` y `useArticulos`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Aplicación |
| **Depende de** | [040](040-dominio-lista.md), [041](041-dominio-articulo.md), [044](044-colecciones.md), [045](045-realtime-direct-writes.md), [047](047-use-hogar.md) |
| **Bloquea a** | 049, 050 |

## Objetivo

Los hooks que consume la interfaz.

## Pasos

- [ ] `useListas` con crear, renombrar y borrar.
- [ ] `useArticulos` con añadir, editar, marcar, desmarcar, eliminar y vaciar comprados.
- [ ] Mutaciones optimistas con reversión.

## Hecho cuando

- La interfaz no hace aritmética de negocio ni conoce InsForge.

## Ojo con esto

La desduplicación del eco —ver dos veces tu propio cambio— **la resuelve la librería**, no código nuestro. Si aparece parpadeo, el problema está en la configuración, no en falta de código defensivo.
