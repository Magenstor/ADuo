# 034 — TanStack Router

| | |
|---|---|
| **Estado** | ✅ hecha (la navegación queda por comprobar) |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [032](032-esqueleto-carpetas.md) |
| **Bloquea a** | 038 |

## Objetivo

El árbol de rutas.

## Pasos

- [x] Instalar y configurar TanStack Router. Ya vino con el andamiaje ([026](026-proyecto-vite.md)).
- [x] Montar el árbol raíz en `src/app/router.tsx`.

## Hecho cuando

- Navegar entre dos rutas funciona.

## Resultado

Hecha el 22 de agosto de 2026.

| Antes | Ahora |
|---|---|
| `src/router.tsx` | `src/app/router.tsx` |
| `src/main.tsx` | `src/app/main.tsx` |
| `index.html` → `/src/main.tsx` | `index.html` → `/src/app/main.tsx` |

`src/routes/` **no se ha tocado**, según el apartado 2.1 de `../03-Arquitectura.md`.

### Había dos routers, y uno sobraba

Al abrir los archivos apareció algo que la tarea no anticipaba: `router.tsx` exportaba `getRouter()`
y declaraba el tipo `Register`, **pero nadie lo importaba**. `main.tsx` construía su propio router
con `createRouter` y declaraba `Register` otra vez.

Dos fuentes de verdad para el mismo árbol, y la que tenía nombre de ser la buena estaba muerta. Ahora
`main.tsx` consume `getRouter()` y el tipo se declara una sola vez.

Verificado: `vite build` correcto, `tsc --noEmit` limpio y los tests siguen pasando después de mover
los dos ficheros y reapuntar `index.html`.

### Lo que NO se ha verificado

**Que navegar entre dos rutas funcione**, porque **solo existe una ruta**: `/`. Con un único destino
no hay navegación que probar. Se cierra en cuanto exista la segunda, que llega con la
[036](036-login-google.md) o la [048](048-ui-listas.md).

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
