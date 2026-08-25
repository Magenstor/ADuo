# 032 — Crear el esqueleto de carpetas

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [028](028-alias-import.md) |
| **Bloquea a** | 033, 040, 043, 047, 049 |

## Objetivo

La estructura que hace visible de qué va la aplicación.

## Pasos

- [x] Crear `src/app`, `src/modules/listas/{domain,application,infrastructure,ui}`, `src/shared/{ui,lib,api,hogar}`.
- [x] Crear el `index.ts` del módulo de listas.

## Hecho cuando

- La estructura del apartado 2 de `03-Arquitectura.md` existe.

## Resultado

Hecha el 22 de agosto de 2026.

```
src/
  app/providers/
  modules/listas/{domain,application,infrastructure,ui}/
  modules/listas/index.ts
  shared/{ui,lib,api,hogar}/
```

Las carpetas todavía vacías llevan un `.gitkeep`, porque git no versiona directorios vacíos y sin él
el esqueleto no llegaría al repositorio.

`modules/listas/index.ts` no exporta nada aún: es la superficie pública del módulo y deja escritas
las reglas de capas para quien lo abra.

### Lo que esta tarea NO ha tocado

`src/main.tsx`, `src/router.tsx` y `src/routes/` siguen donde los dejó el andamiaje. El apartado 2 de
la arquitectura los quiere bajo `src/app/`, y moverlos es el trabajo de la [034](034-router.md).

**`src/routes/` en cambio se queda donde está.** Decidido el 22 de agosto de 2026: las rutas siguen
el enrutado por ficheros de TanStack Router, y cada archivo de ruta es una cáscara fina que importa
el componente de `modules/<módulo>/ui/`. Razonamiento completo y cuándo reconsiderarlo, en el
apartado 2.1 de `../03-Arquitectura.md`.

## Ojo con esto

Las reglas que sostienen esto: `domain/` es TypeScript puro —**si un archivo de `domain/` necesita
un mock para testearse, está mal colocado**—, `infrastructure/` es la única capa que conoce InsForge,
y `shared` no importa nunca de `modules`.
