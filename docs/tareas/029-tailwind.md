# 029 — Tailwind CSS 4

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [026](026-proyecto-vite.md) |
| **Bloquea a** | 030 |

## Objetivo

Los estilos, mobile-first. **Y resolver un conflicto que ya existe en el repositorio.**

## Decidido el 20 de agosto de 2026

**Tailwind 4.** Se queda la 4.1.18 que instaló el andamiaje. InsForge pide la 3.4, pero esa
instrucción existe por **sus plantillas**, que asumen la sintaxis de la v3 — y nosotros no usamos sus
plantillas. Tailwind no toca el backend: InsForge sirve ficheros estáticos. Razonamiento completo en
el apartado 2.5b de `../02-Decisiones-tecnicas-stack.md`.

**Los `latest` se quedan.** El lockfile está versionado y es quien fija de verdad lo que se instala.
Resolución actual: `react-router` 1.170.31, `react-router-devtools` 1.167.1, `devtools-vite`
1.168.34, `react-devtools` 0.10.11 y `eslint-config` 0.4.0.

Las dos que están por debajo de 1.0 **son herramientas de desarrollo y no llegan al bundle**, así que
quedan justificadas frente a la política del apartado 2.2. El listón de madurez se puso para lo que
ejecuta el usuario, no para lo que ejecuta quien programa.

⚠️ **La condición que hace segura esta decisión:** `pnpm-lock.yaml` se versiona siempre y no se
regenera a la ligera. Un `latest` sin lockfile sí sería una ruleta.

## Pasos

- [x] Decidir la versión: **Tailwind 4**.
- [x] Decidir qué hacer con los `latest`: **se quedan**, protegidos por el lockfile.
- [x] Corregir el apartado 2.5b del stack, que decía lo contrario.
- [x] Configurar los estilos base, mobile-first.

## Hecho cuando

- Las clases de Tailwind funcionan.
- La decisión de versión está escrita en el apartado 2.5b del stack, no solo aquí.

## Resultado

Verificado el 22 de agosto de 2026. **La instalación ya venía del andamiaje de la
[026](026-proyecto-vite.md)**; esta tarea la comprobó y añadió los estilos base con la
[030](030-shadcn.md).

| Comprobación | Estado |
|---|---|
| `tailwindcss` y `@tailwindcss/vite` | 4.1.18 las dos. |
| Plugin en `vite.config.ts` | `tailwindcss()` declarado. |
| `@import 'tailwindcss'` en `src/styles.css` | Sí. |
| `tailwind.config.js` | **No existe, y es lo correcto** en la v4: la configuración es CSS-first. |

Las clases funcionan de verdad, no por lectura de la configuración: un `vite build` con un
componente real generó `background-color: var(--background)`, `border-color: var(--border)` y
`outline-color: var(--ring)` en el CSS de salida, que pasó de 5,07 kB a 19,52 kB.

## Ojo con esto

Tailwind 4 se configura **desde CSS con `@theme`**, no con `tailwind.config.js`. Si buscás una
receta de configuración y te encuentras un `tailwind.config.js`, es de la v3 y no aplica.

Y para shadcn (tarea [030](030-shadcn.md)): asegurate de usar una versión de su CLI que soporte
Tailwind 4, porque las recetas antiguas generan configuración de la v3.
