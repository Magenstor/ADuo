# 003 — Obtener `baseUrl` y anon key

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | — |
| **Bloquea a** | 033 |

## Objetivo

Dejar anotadas las dos credenciales que necesita el frontend.

## Pasos

- [x] Obtener la anon key con `get-anon-key` o `npx @insforge/cli secrets get ANON_KEY`.
- [x] Anotar `baseUrl`: `https://rn8y8xbv.eu-central.insforge.app`.

## Hecho cuando

- Las dos están en `frontend/.env`, que `frontend/.gitignore` ya ignoraba en su línea 6.
- `frontend/.env.example` queda versionado, sin valores.

## Resultado

| Variable | Valor |
|---|---|
| `VITE_INSFORGE_URL` | `https://rn8y8xbv.eu-central.insforge.app` |
| `VITE_INSFORGE_ANON_KEY` | `anon_65726966…` (en `frontend/.env`) |

**Nota:** la herramienta `get-anon-key` del MCP avisa de que su ruta está **obsoleta**. La vigente es
`GET /api/metadata/anon-key`. Si algún día hay que regenerarla, usar esa.

## Ojo con esto

⚠️ La anon key irá en una variable `VITE_`, y **todo lo prefijado `VITE_` acaba en el bundle que
descarga cualquiera**. Eso es correcto para la anon key, porque quien protege los datos es RLS.

Una clave de servicio o de admin ahí **jamás**. Si una clave de servicio llega al bundle, RLS deja
de existir y con ella el modelo de seguridad entero del producto.
