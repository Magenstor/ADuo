# 037 — Comprobar que `requireEmailVerification` no bloquea OAuth

| | |
|---|---|
| **Estado** | ✅ hecha |
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

## Resultado

Hecha el 3 de septiembre de 2026, comprobada contra el backend en vivo.

El alta por OAuth del 25 de agosto de 2026 creó la única fila de `auth.users`
(`carlosrios98.cm@gmail.com`) con `email_verified = true`, y esa misma sesión devolvió
`accessToken` sin `requireEmailVerification: true`. Google entrega el correo ya verificado,
así que el flag no bloquea y **se queda activado**: no hace falta tocar la configuración.
