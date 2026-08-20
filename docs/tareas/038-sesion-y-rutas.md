# 038 — Sesión persistente y rutas protegidas

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [034](034-router.md), [036](036-login-google.md) |
| **Bloquea a** | 046 |

## Objetivo

Que la aplicación no pida login en cada apertura.

## Pasos

- [ ] Llamar a `auth.getCurrentUser()` al arrancar, que refresca solo con la cookie `httpOnly`.
- [ ] Proteger las rutas que exigen sesión.
- [ ] Mostrar un estado de carga mientras se resuelve, para que no parpadee el login.

## Hecho cuando

- Cerrar y abrir la aplicación mantiene la sesión.
- Una ruta protegida redirige al login si no hay sesión.
