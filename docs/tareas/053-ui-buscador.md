# 053 — Buscador dentro de la lista

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Interfaz |
| **Depende de** | [041](041-dominio-busqueda.md), [049](049-ui-detalle.md) |
| **Bloquea a** | — |

## Objetivo

Encontrar rápido en una lista larga.

## Pasos

- [ ] Campo de búsqueda que filtra por texto usando la normalización del dominio.
- [ ] Mantener el agrupado: pendientes antes que comprados.

## Hecho cuando

- Buscar `azucar` encuentra `Azúcar`.
- Filtrar no dispara ninguna petición al servidor.

## Ojo con esto

**El texto de búsqueda no forma parte de la query key.** Si entrase, cada tecla pulsada crearía una
entrada de caché nueva y un viaje al servidor. La búsqueda es **estado de vista**, no criterio de
obtención de datos, y se resuelve en cliente porque los artículos ya están en memoria.
