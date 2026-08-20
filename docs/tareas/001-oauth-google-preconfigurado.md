# 001 — Google OAuth ya viene configurado

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Backend · InsForge |
| **Depende de** | — |
| **Bloquea a** | 036 |

## Objetivo

Comprobar que no hace falta crear un cliente OAuth propio en Google Cloud Console.

## Pasos

- [x] Leer `auth.oauth_configs` y confirmar la fila de `google`.
- [x] Confirmar `use_shared_key: true` y los scopes `openid`, `email`, `profile`.

## Hecho cuando

- `auth.oauth_configs` tiene `google` con `use_shared_key: true` y sin `client_id` propio.
- Los scopes incluyen `profile`, que es de donde sale el nombre y el avatar.

## Ojo con esto

InsForge fija `client_id`, `redirect_uri`, `scope`, `state` y `code_challenge` **en el servidor** e
ignora los que mande el cliente. Ante Google quien pide el consentimiento es InsForge, así que
**la pantalla de Google mostrará el nombre de InsForge, no "ADuo"**. Para un hogar de dos da igual.

Migrar algún día a un cliente propio no rompe datos: `auth.users.id` es un uuid de InsForge, no el
identificador de Google.
