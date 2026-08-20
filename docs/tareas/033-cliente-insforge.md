# 033 — Cliente de InsForge

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [003](003-obtener-claves.md), [027](027-gitignore-env.md), [032](032-esqueleto-carpetas.md) |
| **Bloquea a** | 036, 042 |

## Objetivo

El único punto por el que la aplicación habla con el backend.

## Pasos

- [ ] `pnpm add @insforge/sdk`.
- [ ] Crear el cliente en `src/shared/api` con `baseUrl` y `anonKey` desde las variables `VITE_`.

## Hecho cuando

- El cliente se importa y responde.

## Ojo con esto

El SDK devuelve siempre `{ data, error }`, y **los insert van en array**. Conviene envolverlo una vez y no repetir esa comprobación en cada llamada.
