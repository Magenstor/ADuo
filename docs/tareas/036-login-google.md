# 036 — Entrar con Google y cerrar sesión

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [001](001-oauth-google-preconfigurado.md), [033](033-cliente-insforge.md) |
| **Bloquea a** | 037, 038 |

## Objetivo

El acceso. Una sola pantalla.

## Pasos

- [ ] Llamar a `insforge.auth.signInWithOAuth('google', { redirectTo })`.
- [ ] Manejar la vuelta: el SDK detecta el `insforge_code`, canjea la sesión y la guarda solo.
- [ ] Implementar el cierre de sesión.

## Hecho cuando

- Se entra con Google y se sale.
- En `auth.users` aparece la fila con `profile.name` y `profile.avatar_url`.

## Ojo con esto

**Registrarse e iniciar sesión son la misma acción.** No hay dos pantallas, ni formulario, ni
contraseña, ni recuperación: ADuo no gestiona contraseñas.

Cerrar sesión es **local**: salir de ADuo no cierra la sesión de Google en el dispositivo.
