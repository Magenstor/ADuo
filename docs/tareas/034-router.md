# 034 — TanStack Router

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [032](032-esqueleto-carpetas.md) |
| **Bloquea a** | 038 |

## Objetivo

El árbol de rutas.

## Pasos

- [x] Instalar y configurar TanStack Router. Ya vino con el andamiaje ([026](026-proyecto-vite.md)).
- [ ] Montar el árbol raíz en `src/app/router.tsx`.

## Hecho cuando

- Navegar entre dos rutas funciona.

## Decidido antes de empezar

**Los ficheros de ruta se quedan en `src/routes/`**, con el enrutado por ficheros de TanStack Router
tal como viene. Nada de `virtualRouteConfig` en el módulo 1. Cada archivo de ruta es una cáscara
fina; la lógica vive en `modules/<módulo>/ui/`. Apartado 2.1 de `../03-Arquitectura.md`.

Lo que esta tarea sí mueve es `src/router.tsx` y `src/main.tsx` a `src/app/`, que es lo que pide el
apartado 2 de la arquitectura. `src/routes/` no se toca.

**`src/routeTree.gen.ts` se versiona.** Lo generó el primer build. No es un artefacto de
compilación: la FAQ de TanStack Router lo llama parte del *runtime* de la aplicación, y sin él la
app no arranca hasta que alguien ejecute el generador.

Al mover `router.tsx` hay que revisar dos cosas que hoy apuntan a `./routeTree.gen`: el propio
`router.tsx` y `main.tsx`. Y `tsr.config.json` solo declara `{ "target": "react" }`, así que el
generador seguirá escribiendo el árbol en su ubicación por defecto: comprobar que la ruta relativa
sigue cuadrando después de la mudanza.
