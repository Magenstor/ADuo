# 003 — Obtener `baseUrl` y anon key

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Backend · InsForge |
| **Depende de** | — |
| **Bloquea a** | 033 |

## Objetivo

Dejar anotadas las dos credenciales que necesita el frontend.

## Pasos

- [ ] Obtener la anon key con `get-anon-key` o `npx @insforge/cli secrets get ANON_KEY`.
- [ ] Anotar `baseUrl`: `https://rn8y8xbv.eu-central.insforge.app`.

## Hecho cuando

- Las dos están anotadas y listas para el `.env` de la tarea 027.

## Ojo con esto

⚠️ La anon key irá en una variable `VITE_`, y **todo lo prefijado `VITE_` acaba en el bundle que
descarga cualquiera**. Eso es correcto para la anon key, porque quien protege los datos es RLS.

Una clave de servicio o de admin ahí **jamás**. Si una clave de servicio llega al bundle, RLS deja
de existir y con ella el modelo de seguridad entero del producto.
