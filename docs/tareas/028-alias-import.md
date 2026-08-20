# 028 — Alias `@/` hacia `src/`

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [026](026-proyecto-vite.md) |
| **Bloquea a** | 030, 032 |

## Objetivo

Imports legibles y, sobre todo, que la CLI de shadcn funcione.

## Pasos

- [ ] Declarar el alias en `vite.config.ts`.
- [ ] Declarar el alias en `tsconfig.json`.

## Hecho cuando

- `import { x } from '@/shared/lib/x'` resuelve en el editor y en el build.

## Ojo con esto

**En los dos archivos.** Si falta en uno, TypeScript y Vite discrepan: el editor marca error y el
build funciona, o al revés. Y la CLI de shadcn falla al generar componentes.
