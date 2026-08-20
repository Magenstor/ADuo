# 026 — Crear el proyecto con Vite

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | — |
| **Bloquea a** | 027, 028, 029, 031 |

## Objetivo

El esqueleto del frontend.

## Pasos

- [x] `pnpm create vite` con React y TypeScript.
- [x] `pnpm install`.

## Hecho cuando

- `pnpm dev` levanta la aplicación.

## Lo que trajo el andamiaje

React 19.2, Vite 8, TypeScript 6, TanStack Router, ESLint y Prettier. Y **dos cosas que hay que
mirar antes de seguir**:

1. **Tailwind 4.1.18 con `@tailwindcss/vite`**, cuando InsForge pide la 3.4. Ver la tarea
   [029](029-tailwind.md).
2. **Cinco dependencias fijadas como `latest`**, que no es una versión. Ver la tarea
   [029](029-tailwind.md).
