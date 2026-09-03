# 038 — Sesión persistente y rutas protegidas

| | |
|---|---|
| **Estado** | ✅ hecha (falta la comprobación manual en vivo) |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [034](034-router.md), [036](036-login-google.md) |
| **Bloquea a** | 039, 047 |

## Objetivo

Que la aplicación no pida login en cada apertura.

## Pasos

- [ ] Llamar a `auth.getCurrentUser()` al arrancar, que refresca solo con la cookie `httpOnly`.
- [ ] Proteger las rutas que exigen sesión.
- [ ] Mostrar un estado de carga mientras se resuelve, para que no parpadee el login.

## Hecho cuando

- Cerrar y abrir la aplicación mantiene la sesión.
- Una ruta protegida redirige al login si no hay sesión.

## Resultado

Hecha el 3 de septiembre de 2026, vía SDD (`sesion-y-rutas`).

| Archivo | Qué cambió |
|---|---|
| `src/shared/hogar/use-sesion.ts` | Exporta `useEstadoSesion` (uso interno); la forma pública sigue siendo `useSesion()`. |
| `src/shared/hogar/sesion-contexto.tsx` | **Nuevo.** `SesionProvider` y el hook `useSesion()` para consumidores. |
| `src/shared/hogar/ui/sesion-resuelta.tsx` | **Nuevo.** El cierre de puerta: mientras se carga, renderiza `role="status"`, sin botón de entrada. |
| `src/app/providers/query.tsx` | `SesionProvider` se monta dentro de `QueryClientProvider`. |
| `src/routes/__root.tsx` | Envuelve `<Outlet/>` en `<SesionResuelta>` para pausar todas las rutas. |
| `src/routes/_privado.tsx` | **Nuevo.** Guarda sin sesión: redirige a `/` con `replace: true`. |
| `src/routes/_privado/app.tsx` | **Nuevo.** `/app`, la ruta protegida —un marcador de posición para la tarea 039. |
| `src/app/rutas-protegidas.test.tsx` | **Nuevo.** Pruebas de árbol de rutas: cerrado redirige, abierto renderiza, nunca-resuelto no parpadea. |
| `src/app/router.tsx` | `getRouter()` acepta `history?: RouterHistory` (para pruebas de memoria). |
| `docs/03-Arquitectura.md` | Aclara que `app/providers/` compone, no define —`SesionProvider` nace en `shared/hogar/`. |

**La sesión se resuelve una sola vez para toda la aplicación**, desde `use-sesion.ts`. Reabre la app → la cookie `httpOnly` refuerza la sesión sin parpadeo. `/app` con sesión → renderiza. `/app` sin sesión → redirige a `/` con botón de entrada.

### Aceptación manual contra InsForge en vivo

Automatizable e implementado: `pnpm test` 37/37, `pnpm lint` limpio, `pnpm check` limpio, `pnpm build` limpio. Todos los requisitos probados.

**Aceptación manual pendiente** (no ejecutada aún):
- (5.2) `pnpm dev`, entra con Google, cierra la pestaña / recarga dura, reabre. La sesión debe persistir sin "Entra con Google" nunca.
- (8.3) `pnpm dev`, cierra sin sesión, visita `/app` → aterriza en `/`. Entra, visita `/app` → marca de posición sin redirigir.

### Tamaño real

464 líneas (presupuesto: 400). Excepción de tamaño aceptada por el usuario para una sola PR.

### Requisitos del spec: 9/9 ✅

1. ✅ Sesión única de toda la aplicación.
2. ✅ Sin contenido mientras se carga —muestra `role="status"`.
3. ✅ La sesión sobrevive a recargar —la cookie `httpOnly` lo garantiza.
4. ✅ `SIGNED_OUT` limpia sin volver a leer —necesaria tras una vuelta OAuth.
5. ✅ Después de desmontar, promesa tardía no actualiza.
6. ✅ Entrar mantiene la pantalla de acceso y su alerta.
7. ✅ La forma sigue siendo `{ user, loading, error, signIn, signOut }`.
8. ✅ Ruta protegida redirige sin sesión —`replace: true` cuidado.
9. ✅ Ruta protegida renderiza con sesión.

Las tareas 039 y 047 se desbloquean ahora.
