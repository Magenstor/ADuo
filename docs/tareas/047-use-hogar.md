# 047 — `useHogar`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Aplicación |
| **Depende de** | [032](032-esqueleto-carpetas.md), [038](038-sesion-y-rutas.md) |
| **Bloquea a** | 048 |

## Objetivo

El hogar del usuario y sus miembros.

## Pasos

- [ ] Hook en `shared/hogar/` que expone el hogar y la lista de miembros.

## Hecho cuando

- Cualquier pantalla puede saber en qué hogar está y quién lo comparte.

## Ojo con esto

Es transversal, no es un módulo: vive en `shared/hogar/`, porque de él cuelgan después gastos y bolsas.
