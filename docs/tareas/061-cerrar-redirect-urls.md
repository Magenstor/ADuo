# 061 — Cerrar la redirección abierta

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · PWA y despliegue |
| **Depende de** | [060](060-desplegar.md) |
| **Bloquea a** | 062 |

## Objetivo

Dejar de permitir cualquier redirección de OAuth. **Obligatorio antes de usarla de verdad.**

## Pasos

- [ ] Añadir a `allowedRedirectUrls` el origen de desarrollo y el de producción, con su ruta exacta.
- [ ] Verificar que un `redirect_uri` ajeno ahora es rechazado.

## Hecho cuando

- Un `redirect_uri` no listado devuelve error.
- El login sigue funcionando desde los dos orígenes.

## Ojo con esto

⚠️ **Lista vacía no significa "bloquea todo": significa "permite todo".** Verificado contra el
servidor: `GET /api/auth/oauth/google` con un `redirect_uri` de un dominio atacante inventado
responde **HTTP 200** y devuelve un `authUrl` válido.

Con la lista vacía, cualquiera puede fabricar un enlace de login que apunte a **su** servidor y con
**su** `code_challenge`. Quien lo pulse se autentica de verdad contra Google, el `insforge_code` cae
en manos ajenas, y como el atacante también tiene el `code_verifier`, lo canjea y **entra con la
cuenta de la víctima**.

Se admiten comodines solo en el host y enlaces profundos (`aduo://auth/callback`) si se listan.
