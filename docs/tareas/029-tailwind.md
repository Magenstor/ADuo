# 029 — Tailwind CSS 3.4

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [026](026-proyecto-vite.md) |
| **Bloquea a** | 030 |

## Objetivo

Los estilos, mobile-first. **Y resolver un conflicto que ya existe en el repositorio.**

## El conflicto

El andamiaje instaló **Tailwind 4.1.18** con `@tailwindcss/vite`. La documentación de InsForge dice
literalmente que se use la **3.4** y que no se suba a la 4.

**Pero conviene mirar de dónde sale esa instrucción.** Tailwind no toca el backend: InsForge sirve
ficheros estáticos y le da igual con qué se generó el CSS. La instrucción existe por **sus
plantillas y su generación de código**, que asumen la sintaxis y el `tailwind.config.js` de la v3 —
la v4 se configura desde CSS con `@theme`. Nosotros no usamos sus plantillas: tenemos arquitectura
propia en `03-Arquitectura.md`.

Decisión a tomar, con lo que cuesta cada una:

| Opción | A favor | En contra |
|---|---|---|
| **Quedarse en la 4** (ya instalada) | Es la versión actual y el andamiaje ya está montado con `@tailwindcss/vite` | Nos salimos de lo que InsForge recomienda; fricción si algún día usamos una plantilla suya |
| **Bajar a la 3.4** | Sigue la recomendación al pie de la letra | Deshacer el andamiaje para obedecer una restricción que no nos aplica |

## Lo otro que hay que arreglar aquí

`package.json` tiene **cinco dependencias fijadas como `latest`**: `@tanstack/react-devtools`,
`@tanstack/react-router`, `@tanstack/react-router-devtools`, `@tanstack/devtools-vite` y
`@tanstack/eslint-config`.

`latest` no es una versión, es "lo que haya el día que se instale". El lockfile lo tapa mientras
exista, pero cualquier resolución nueva puede saltar de mayor sin avisar. Y contradice de frente la
política del apartado 2.2 del stack —«1.0 o superior entra; 0.x se justifica una por una»—: **no se
puede aplicar un criterio de versión a algo que no está fijado**.

## Pasos

- [ ] Decidir entre quedarse en la 4 o bajar a la 3.4.
- [ ] Anclar la versión elegida en `package.json`, sin rango que permita saltar de mayor.
- [ ] Configurar los estilos base, mobile-first.
- [ ] Sustituir los cinco `latest` por versiones concretas.

## Hecho cuando

- Las clases de Tailwind funcionan.
- `package.json` no contiene ningún `latest`.
- La versión de Tailwind está anclada y la decisión queda escrita en el stack.

## Ojo con esto

Sea cual sea la versión elegida, **anclarla de verdad**. Un `^3.4` no impide el salto el día que
alguien reinstale, y un `latest` lo garantiza.

Si se decide quedarse en la 4, hay que **corregir el apartado 2.5b de
`../02-Decisiones-tecnicas-stack.md`**, que ahora mismo dice lo contrario. Una decisión revocada se
reescribe, no se deja conviviendo con la nueva.
