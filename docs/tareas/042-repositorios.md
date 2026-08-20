# 042 — Repositorios de listas y artículos

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Infraestructura |
| **Depende de** | [032](032-esqueleto-carpetas.md), [033](033-cliente-insforge.md) |
| **Bloquea a** | 043 |

## Objetivo

Hablar con InsForge y devolver tipos de dominio.

## Pasos

- [ ] Repositorio de listas y repositorio de artículos contra PostgREST.
- [ ] Traducir la fila del backend al tipo de dominio.

## Hecho cuando

- La interfaz nunca ve la forma cruda de la tabla.

## Ojo con esto

**Sin filtros de borrado.** El borrado es físico, así que no hay `deleted_at IS NULL` que recordar en ninguna consulta. Ese es justamente el regalo de haber elegido borrado físico.
