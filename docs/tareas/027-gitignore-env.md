# 027 — `.gitignore` y variables de entorno

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [003](003-obtener-claves.md), [026](026-proyecto-vite.md) |
| **Bloquea a** | 033 |

## Objetivo

Que ninguna clave acabe en el repositorio.

## Pasos

- [ ] Comprobar que `.gitignore` cubre **`.env` a secas**, no solo `*.local`.
- [ ] Crear `.env` con `VITE_INSFORGE_URL` y `VITE_INSFORGE_ANON_KEY`.
- [ ] Crear `.env.example` sin valores reales, ese sí versionado.

## Hecho cuando

- `git status` no ve el `.env`.
- El proyecto arranca leyendo las dos variables.

## Ojo con esto

La plantilla de Vite trae `*.local`, que **no** cubre `.env`. Comprobarlo **antes** de escribir la
primera clave: una vez commiteada, quitarla del historial es otra tarea entera.
