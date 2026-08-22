# 028 — Alias `@/` hacia `src/`

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [026](026-proyecto-vite.md) |
| **Bloquea a** | 030, 032 |

## Objetivo

Imports legibles y, sobre todo, que la CLI de shadcn funcione.

## Pasos

- [x] Declarar el alias en `vite.config.ts`.
- [x] Declarar el alias en `tsconfig.json`.

## Hecho cuando

- `import { x } from '@/shared/lib/x'` resuelve en el editor y en el build.

## Resultado

Verificado el 22 de agosto de 2026. **Ya venía del andamiaje**, declarado en los dos sitios, pero de
una forma distinta a la que esperaba esta tarea:

| Archivo | Cómo está declarado |
|---|---|
| `tsconfig.json` | `paths`: `"@/*": ["./src/*"]` y también `"#/*"`. |
| `vite.config.ts` | No hay un `alias` a mano: `resolve: { tsconfigPaths: true }` hace que Vite 8 lea los `paths` del `tsconfig`. |

Eso es **mejor** que declararlo dos veces, y precisamente por la razón del apartado siguiente: con
una sola fuente de verdad, TypeScript y Vite no pueden discrepar.

Comprobado con un import real, no por lectura de la configuración:

1. `tsc --noEmit` sobre un archivo que importa `@/shared/api/insforge` → sin errores.
2. `vite build` con ese import colgando del punto de entrada → 192 módulos transformados frente a
   106 sin él. El alias arrastró el SDK de verdad, así que resolvió.

El archivo de prueba se eliminó después.

## Ojo con esto

**En los dos archivos.** Si falta en uno, TypeScript y Vite discrepan: el editor marca error y el
build funciona, o al revés. Y la CLI de shadcn falla al generar componentes.
