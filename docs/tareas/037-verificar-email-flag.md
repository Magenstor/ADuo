# 037 — Comprobar que `requireEmailVerification` no bloquea OAuth

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [036](036-login-google.md) |
| **Bloquea a** | — |

## Objetivo

Descartar que un usuario quede atrapado sin salida.

## Pasos

- [ ] Entrar por primera vez con una cuenta nueva.
- [ ] Comprobar que se recibe `accessToken` y no `requireEmailVerification: true`.

## Hecho cuando

- El alta por OAuth funciona con el flag activado.
- O, si bloquea, el flag queda desactivado.

## Ojo con esto

El proyecto tiene `require_email_verification: true` **y el SMTP apagado**. Google entrega el email
ya verificado, así que no debería bloquear. Pero si bloqueara, el usuario quedaría en "sin verificar"
**sin ninguna forma de salir**, porque no hay quien le mande el correo.
