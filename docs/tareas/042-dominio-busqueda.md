# 042 — `domain/busqueda.ts`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Dominio |
| **Depende de** | [040](040-dominio-lista.md) |
| **Bloquea a** | 054 |

## Objetivo

Normalizar texto para que la búsqueda sirva en español.

## Pasos

- [ ] Tests primero: `azucar` tiene que encontrar `Azúcar`.
- [ ] Normalización que ignora mayúsculas y acentos.

## Hecho cuando

- Los tests cubren acentos, mayúsculas y cadena vacía.

## Ojo con esto

En español esto no es un extra, es el mínimo para que un buscador sirva. Por eso es **regla de dominio** y no un detalle de la interfaz.
