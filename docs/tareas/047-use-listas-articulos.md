# 047 — `useListas` y `useArticulos`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Aplicación |
| **Depende de** | [039](039-dominio-lista.md), [040](040-dominio-articulo.md), [043](043-colecciones.md), [044](044-realtime-direct-writes.md), [046](046-use-hogar.md) |
| **Bloquea a** | 048, 049 |

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
