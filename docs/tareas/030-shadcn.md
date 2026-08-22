# 030 — Inicializar shadcn/ui

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [028](028-alias-import.md), [029](029-tailwind.md) |
| **Bloquea a** | 048 |

## Objetivo

El generador de componentes.

## Pasos

- [x] `shadcn init`, apuntando la salida a `src/shared/ui`.

## Hecho cuando

- Se puede generar un componente y aparece en `src/shared/ui`.

## Resultado

Hecha el 22 de agosto de 2026. `shadcn add button` creó `src/shared/ui/button.tsx`, que es
exactamente la condición de esta tarea.

**Tema elegido:** `radix-maia` con base `mist` y la tipografía Space Grotesk.

| Archivo | Qué aporta |
|---|---|
| `components.json` | La configuración. Los `aliases` mandan a `shared/`, no a `src/components`. |
| `src/shared/lib/utils.ts` | El `cn()` que importa todo componente de shadcn. |
| `src/styles.css` | Variables de tema en OKLCH, claro y oscuro. |

Dependencias añadidas: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`,
`lucide-react`, `shadcn`, `@fontsource-variable/space-grotesk` y `tw-animate-css`.

### Los `aliases` son la parte que importa

Por defecto shadcn deja los componentes en `src/components/ui`. Aquí `components.json` los manda a
`@/shared/ui` y las utilidades a `@/shared/lib`, que es lo que pide el apartado 2 de
`../03-Arquitectura.md`. **Si alguien vuelve a ejecutar `shadcn init` y acepta los valores por
defecto, esos alias se pierden** y los siguientes componentes aterrizan en el sitio equivocado.

### Dos desviaciones de la guía oficial de Vite

`https://ui.shadcn.com/docs/installation/vite` pide dos cosas que aquí **no** se aplican, y las dos
por un motivo comprobado:

| La guía pide | Qué se hizo | Por qué |
|---|---|---|
| `"baseUrl": "."` en `tsconfig.json` | **No se añade** | Este proyecto usa TypeScript 6, donde `baseUrl` está **deprecado**: `tsc` falla con `TS5101` y dejará de funcionar en la 7. Con `moduleResolution: bundler` y rutas relativas en `paths`, no hace falta. |
| `resolve.alias` con `path.resolve` en `vite.config.ts` | **No se duplica** | `vite.config.ts` usa `resolve: { tsconfigPaths: true }`, así que Vite lee los `paths` del `tsconfig`. Declararlo también a mano crea dos fuentes de verdad que pueden discrepar. El propio `shadcn init` validó el import alias con esta configuración. |

Comprobado con el ejemplo de la propia guía —un `<Button>` dentro de un contenedor
`flex min-h-svh`—: `tsc` limpio y `vite build` correcto. El archivo de prueba se revirtió, porque
montar la interfaz es trabajo de la [048](048-ui-listas.md).

## Ojo con esto

shadcn no es una dependencia: **copia el código dentro del repositorio**. Los componentes son nuestros y se editan como cualquier otro archivo.
