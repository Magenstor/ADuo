# 040 — `domain/articulo.ts`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Dominio |
| **Depende de** | [039](039-dominio-lista.md) |
| **Bloquea a** | 047 |

## Objetivo

El tipo de artículo, marcar/desmarcar y el orden.

## Pasos

- [ ] Tests primero.
- [ ] Marcar como comprado, y desmarcar **limpiando `bought_at` y `bought_by`**.
- [ ] La regla de orden: pendientes primero, y dentro de cada grupo por incorporación.

## Hecho cuando

- Desmarcar deja la fila coherente con el `CHECK` de la base de datos.
- El orden se testea sin renderizar nada.

## Ojo con esto

Los comprados **no desaparecen**: se muestran marcados al final. En el supermercado hace falta ver lo que ya cogiste, y poder desmarcar si te equivocaste.
