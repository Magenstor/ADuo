# 036 — Entrar con Google y cerrar sesión

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [001](001-oauth-google-preconfigurado.md), [033](033-cliente-insforge.md) |
| **Bloquea a** | 037, 038 |

## Objetivo

El acceso. Una sola pantalla.

## Pasos

- [x] Llamar a `insforge.auth.signInWithOAuth('google', { redirectTo })`.
- [x] Manejar la vuelta: el SDK detecta el `insforge_code`, canjea la sesión y la guarda solo.
- [x] Implementar el cierre de sesión.

## Hecho cuando

- Se entra con Google y se sale.
- En `auth.users` aparece la fila con `profile.name` y `profile.avatar_url`.

## Resultado

Hecha el 25 de agosto de 2026, vía SDD (`login-google`).

| Archivo | Qué cambió |
|---|---|
| `src/shared/hogar/retorno-oauth.ts` | `leerRetornoOAuth(search)` (puro) + la constante `retornoOAuth`, capturada al cargar el módulo, antes de que el SDK limpie `insforge_code`/`error` de la URL. |
| `src/shared/hogar/sesion.ts` | `Usuario`, `ErrorSesion`, `aUsuarioDesdeUserSchema`, `urlDeRetorno`. |
| `src/shared/hogar/use-sesion.ts` | El hook: `{ user, loading, error, signIn, signOut }`. |
| `src/shared/hogar/ui/pantalla-acceso.tsx` | La pantalla: botón de entrada, identidad + salida, alerta persistente por error. |
| `src/shared/api/insforge.ts` | Import de `retorno-oauth` por efecto secundario, encima de `createClient`. |
| `src/routes/index.tsx` | Cáscara fina que renderiza `PantallaAcceso`. |
| `src/shared/ui/alert.tsx`, `src/shared/ui/avatar.tsx` | `shadcn add alert avatar`. |
| `insforge.toml` | Registra `http://localhost:3000/` en `allowedRedirectUrls` (fase 0, aprobada por el usuario). |

**Registrarse e iniciar sesión siguen siendo la misma acción**, y cerrar sesión sigue siendo local:
sin llamada a InsForge para revocar la sesión de Google en el dispositivo.

### La vuelta sin sesión es un fallo ruidoso, no un fallback silencioso

Si la URL trae `insforge_code` y `getCurrentUser()` devuelve `user: null`, la pantalla muestra una
alerta persistente en vez de caer en la vista de sesión cerrada. Es la única forma de que una
regresión de la [037](037-verificar-email-flag.md) (verificación de email obligatoria sin SMTP) no
pase inadvertida.

### Aceptación manual contra InsForge en vivo

Automatizable e implementado: `pnpm test` 27/27, `pnpm lint` limpio, `pnpm build` limpio.
Aceptación manual verificada: entrada con Google en vivo, fila en `auth.users` con `profile.name` y
`profile.avatar_url` confirmada, salida devuelve a la pantalla de acceso.

## Ojo con esto

**Registrarse e iniciar sesión son la misma acción.** No hay dos pantallas, ni formulario, ni
contraseña, ni recuperación: ADuo no gestiona contraseñas.

Cerrar sesión es **local**: salir de ADuo no cierra la sesión de Google en el dispositivo.
