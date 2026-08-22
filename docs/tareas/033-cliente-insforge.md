# 033 — Cliente de InsForge

| | |
|---|---|
| **Estado** | ✅ hecha (falta una comprobación en caliente) |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [003](003-obtener-claves.md), [027](027-gitignore-env.md), [032](032-esqueleto-carpetas.md) |
| **Bloquea a** | 036, 042 |

## Objetivo

El único punto por el que la aplicación habla con el backend.

## Pasos

- [x] `pnpm add @insforge/sdk`. Resuelto a **1.5.2**.
- [x] Crear el cliente en `src/shared/api` con `baseUrl` y `anonKey` desde las variables `VITE_`.

## Hecho cuando

- El cliente se importa y responde.

## Resultado

Hecha el 22 de agosto de 2026. Dos archivos:

| Archivo | Qué hace |
|---|---|
| `src/shared/api/insforge.ts` | `createClient` con `import.meta.env.VITE_INSFORGE_URL` y `VITE_INSFORGE_ANON_KEY`. |
| `src/vite-env.d.ts` | Tipa esas dos variables, para que un nombre mal escrito lo cace TypeScript. |

Las variables pasan por un `required()` que lanza con el nombre de la que falta. Sin eso, una
variable ausente llega al SDK como `undefined` y el fallo aparece más tarde y más lejos, en la
primera petición, disfrazado de error de red.

### Verificado

- **Se importa**: `tsc --noEmit` limpio y `vite build` con el cliente colgando del punto de entrada,
  que pasó de 106 a 192 módulos.
- **El backend está vivo**: `GET /api/metadata` sobre `https://rn8y8xbv.eu-central.insforge.app`
  devuelve `401` en 0,24 s. Responde y exige credencial, que es lo correcto.
- **Las variables llegan al cliente**: con `pnpm dev` levantado, el módulo que sirve Vite en
  `/src/shared/api/insforge.ts` trae `VITE_INSFORGE_URL` y `VITE_INSFORGE_ANON_KEY` con los valores
  de la [003](003-obtener-claves.md). Ninguna llega como `undefined`, así que `required()` no salta y
  el cliente se construye.

En desarrollo Vite **no** sustituye `import.meta.env.X` de forma estática: inyecta el objeto
`import.meta.env` entero en la cabecera del módulo. La sustitución estática solo ocurre en `build`.

### Sin verificar

**Que el anon key sea aceptado por el backend.** Se sabe que la clave existe y llega bien formada,
pero no se ha hecho ninguna llamada autenticada: el intento de lanzarla con `curl` lo bloqueó el
control de permisos de la sesión, por extraer una credencial y usarla en una petición saliente.

Se cierra solo en la [036](036-login-google.md), que es la primera que habla con el backend de
verdad. Si la clave estuviera mal, ahí saldría inmediatamente.

## Ojo con esto

El SDK devuelve siempre `{ data, error }`, y **los insert van en array**. Conviene envolverlo una vez y no repetir esa comprobación en cada llamada.
