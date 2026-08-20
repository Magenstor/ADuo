# 032 — Crear el esqueleto de carpetas

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [028](028-alias-import.md) |
| **Bloquea a** | 033, 039, 042, 046, 048 |

## Objetivo

La estructura que hace visible de qué va la aplicación.

## Pasos

- [ ] Crear `src/app`, `src/modules/listas/{domain,application,infrastructure,ui}`, `src/shared/{ui,lib,api,hogar}`.
- [ ] Crear el `index.ts` del módulo de listas.

## Hecho cuando

- La estructura del apartado 2 de `03-Arquitectura.md` existe.

## Ojo con esto

Las reglas que sostienen esto: `domain/` es TypeScript puro —**si un archivo de `domain/` necesita
un mock para testearse, está mal colocado**—, `infrastructure/` es la única capa que conoce InsForge,
y `shared` no importa nunca de `modules`.
