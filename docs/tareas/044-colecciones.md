# 044 — Colecciones de TanStack DB y `staleTime`

| | |
|---|---|
| **Estado** | hecha |
| **Bloque** | Frontend · Infraestructura |
| **Depende de** | [035](035-query-y-db.md), [043](043-repositorios.md) |
| **Bloquea a** | 045, 048 |

## Objetivo

Las colecciones que sostienen las live queries.

## Pasos

- [x] Crear una colección por tabla con `queryCollectionOptions`: `queryKey`, `queryFn`, `queryClient` y `getKey`.
- [x] Declarar `onInsert`, `onUpdate` y `onDelete` contra los repositorios.
- [x] **Fijar un `staleTime` alto.**

## Hecho cuando

- Las colecciones cargan y las mutaciones optimistas revierten si el servidor rechaza.

## Ojo con esto

⚠️ **La trampa que hay que evitar aquí.** Un direct write lo pisa la siguiente ejecución del
`queryFn`, que devuelve el estado completo del servidor. Es comportamiento documentado, no un fallo.

El síntoma cuesta una tarde encontrarlo: **un artículo borrado que reaparece solo**, sin patrón,
porque depende de cuándo toque refetch. Con el WebSocket como fuente de verdad, el refetch periódico
sobra: solo hace falta al recuperar foco y al reconectar.
