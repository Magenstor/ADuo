# 027 — `.gitignore` y variables de entorno

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [003](003-obtener-claves.md), [026](026-proyecto-vite.md) |
| **Bloquea a** | 033 |

## Objetivo

Que ninguna clave acabe en el repositorio.

## Pasos

- [x] Comprobar que `.gitignore` cubre **`.env` a secas**, no solo `*.local`.
- [x] Crear `.env` con `VITE_INSFORGE_URL` y `VITE_INSFORGE_ANON_KEY`.
- [x] Crear `.env.example` sin valores reales, ese sí versionado.

## Hecho cuando

- `git status` no ve el `.env`.
- El proyecto arranca leyendo las dos variables.

## Resultado

Verificado el 22 de agosto de 2026. Los tres pasos ya estaban cubiertos entre el andamiaje de Vite y
la tarea [003](003-obtener-claves.md); esta tarea los comprobó en lugar de rehacerlos.

| Comprobación | Evidencia |
|---|---|
| `frontend/.gitignore` cubre `.env` | Línea 6, `.env` a secas. |
| El `.gitignore` de la raíz también | `.env`, `.env.*` y `!.env.example`. |
| `frontend/.env` existe y git **no** lo ve | `git status --porcelain --ignored` lo devuelve como `!! frontend/.env`. |
| `frontend/.env.example` versionado | Aparece en `git ls-files`. |

El contenido del `.env` **no se ha leído**: la configuración de permisos de la sesión deniega el
acceso a los ficheros `.env`, y así debe seguir. Lo verificado es que existe y que git lo ignora.

## Ojo con esto

La plantilla de Vite trae `*.local`, que **no** cubre `.env`. Comprobarlo **antes** de escribir la
primera clave: una vez commiteada, quitarla del historial es otra tarea entera.

⚠️ **`.mcp.json` solo está ignorado en la rama `feat/auditoria-y-rls`.** En `main` esa línea todavía
no existe, y el fichero lleva la API key de administrador. Hasta que se fusione el PR #2, cualquier
rama nacida de `main` vuelve a estar expuesta. Fue una fuga real: commit `0af9539`.
