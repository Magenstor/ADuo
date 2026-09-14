# Tareas del módulo 1

**Fecha:** 20 de agosto de 2026
**Documento padre:** `../00-Vision-y-Modulos.md`

Una tarea por archivo, numeradas **en orden de ejecución**. Si vas de arriba abajo, nunca te topás
con algo que dependa de una tarea posterior. Cada archivo dice de qué depende, a qué bloquea, cuándo
se considera hecha y con qué hay que tener cuidado.

**El backend entero va antes que el frontend.** No es manía de orden: el frontend consume un esquema,
unas políticas y unos eventos. Escribir `useArticulos` contra una tabla que todavía no tiene
seguridad de fila es escribirlo dos veces.

---

## Punto de partida verificado

Comprobado el 20 de agosto de 2026 contra el proyecto real de InsForge.

| Hecho | Estado | Consecuencia |
|---|---|---|
| URL del proyecto | `https://rn8y8xbv.eu-central.insforge.app` | Es el `baseUrl` del cliente. |
| OAuth de Google | **Ya configurado**, `use_shared_key: true`, scopes `openid email profile` | No hace falta cliente propio de Google Cloud. |
| SMTP | **Deshabilitado** | No hay correo de recuperación. Por eso el acceso se delega en Google. |
| `allowedRedirectUrls` | `["http://localhost:3000/"]` desde el 25 de agosto de 2026 (tarea 036) | Ya no permite todo: al registrar la primera URL se cerró la redirección abierta. Falta añadir la de producción (tarea 061). |
| `auth.users(id uuid)` | Existe | Las claves ajenas del esquema funcionan tal como están escritas. |
| `auth.uid()` | Existe | Es la función de usuario autenticado. |
| Triggers y `SECURITY DEFINER` | Permitidos | La auditoría se implementa como está diseñada. |
| Realtime | Pub/sub sobre canales, **no** streaming de tablas | Los eventos los publica un trigger nuestro. |
| Tablas de la aplicación | **Ninguna** | El esquema está por aplicar entero. |

---

## Lista

### Backend · InsForge

| # | Tarea | Estado |
|---|---|---|
| 001 | [Google OAuth ya viene configurado](001-oauth-google-preconfigurado.md) | ✅ |
| 002 | [Confirmar la tabla de usuarios](002-confirmar-auth-users.md) | ✅ |
| 003 | [Obtener `baseUrl` y anon key](003-obtener-claves.md) | ✅ |
| 004 | [Crear la tabla `households`](004-tabla-households.md) | ✅ |
| 005 | [Crear la tabla `household_members`](005-tabla-household-members.md) | ✅ |
| 006 | [Crear la tabla `shopping_lists`](006-tabla-shopping-lists.md) | ✅ |
| 007 | [Crear la tabla `shopping_items`](007-tabla-shopping-items.md) | ✅ |
| 008 | [Verificar el esquema aplicado](008-verificar-esquema.md) | ✅ |
| 009 | [Auditoría en la fila: `set_auditoria()` y sus triggers](009-auditoria-en-fila.md) | ✅ |
| 010 | [Crear la tabla `audit_log`](010-tabla-audit-log.md) | ✅ |
| 011 | [`registrar_auditoria()` y sus triggers](011-trigger-auditoria.md) | ✅ |
| 012 | [Probar la auditoría y el borrado en cascada](012-probar-auditoria.md) | ✅ |
| 013 | [Habilitar RLS en las cinco tablas](013-habilitar-rls.md) | ✅ |
| 014 | [Políticas de miembro del hogar](014-politicas-hogar.md) | ✅ |
| 015 | [Blindar `audit_log`](015-politica-audit-log.md) | ✅ |
| 016 | [Probar el aislamiento con dos usuarios de verdad](016-probar-aislamiento.md) | ⛔ |

### Backend · Realtime

| # | Tarea | Estado |
|---|---|---|
| 017 | [Crear el patrón de canal `household:%`](017-canal-hogar.md) | ✅ |
| 018 | [Función `publicar_cambio()`](018-funcion-publicar.md) | ✅ |
| 019 | [Triggers de publicación en listas y artículos](019-triggers-publicacion.md) | ✅ |
| 020 | [RLS de suscripción al canal](020-rls-suscripcion.md) | ✅ |
| 021 | [Bloquear la publicación desde el cliente](021-bloquear-publish.md) | ✅ |
| 022 | [Fijar la retención de `realtime.messages`](022-retencion-mensajes.md) | ✅ |
| 023 | [Capturar la forma exacta de los eventos](023-capturar-eventos.md) | ⛔ |

### Backend · Datos iniciales

| # | Tarea | Estado |
|---|---|---|
| 024 | [Crear el hogar y su lista inicial](024-crear-hogar.md) | ⛔ |
| 025 | [Dar de alta a los miembros a mano](025-alta-miembros.md) | ⛔ |

### Frontend · Andamiaje

| # | Tarea | Estado |
|---|---|---|
| 026 | [Crear el proyecto con Vite](026-proyecto-vite.md) | ✅ |
| 027 | [`.gitignore` y variables de entorno](027-gitignore-env.md) | ✅ |
| 028 | [Alias `@/` hacia `src/`](028-alias-import.md) | ✅ |
| 029 | [Tailwind CSS 4](029-tailwind.md) | ✅ |
| 030 | [Inicializar shadcn/ui](030-shadcn.md) | ✅ |
| 031 | [Vitest, Testing Library y jsdom](031-vitest.md) | ✅ |
| 032 | [Crear el esqueleto de carpetas](032-esqueleto-carpetas.md) | ✅ |

### Frontend · Cliente y sesión

| # | Tarea | Estado |
|---|---|---|
| 033 | [Cliente de InsForge](033-cliente-insforge.md) | ✅ |
| 034 | [TanStack Router](034-router.md) | ✅ |
| 035 | [TanStack Query y TanStack DB](035-query-y-db.md) | ✅ |
| 036 | [Entrar con Google y cerrar sesión](036-login-google.md) | ✅ |
| 037 | [Comprobar que `requireEmailVerification` no bloquea OAuth](037-verificar-email-flag.md) | ✅ |
| 038 | [Sesión persistente y rutas protegidas](038-sesion-y-rutas.md) | ✅ |

### Frontend · Esqueleto de interfaz

| # | Tarea | Estado |
|---|---|---|
| 039 | [Esqueleto de la interfaz y navegación](039-esqueleto-interfaz.md) | ☐ |

### Frontend · Dominio

| # | Tarea | Estado |
|---|---|---|
| 040 | [`domain/lista.ts`](040-dominio-lista.md) | ☑ |
| 041 | [`domain/articulo.ts`](041-dominio-articulo.md) | ☑ |
| 042 | [`domain/busqueda.ts`](042-dominio-busqueda.md) | ☑ |

### Frontend · Infraestructura

| # | Tarea | Estado |
|---|---|---|
| 043 | [Repositorios de listas y artículos](043-repositorios.md) | ☑ |
| 044 | [Colecciones de TanStack DB y `staleTime`](044-colecciones.md) | ☑ |
| 045 | [Suscripción y traducción a direct writes](045-realtime-direct-writes.md) | ☑ |
| 046 | [Reconexión y refetch](046-reconexion.md) | ☑ |

### Frontend · Aplicación

| # | Tarea | Estado |
|---|---|---|
| 047 | [`useHogar`](047-use-hogar.md) | ☐ |
| 048 | [`useListas` y `useArticulos`](048-use-listas-articulos.md) | ☐ |

### Frontend · Interfaz

| # | Tarea | Estado |
|---|---|---|
| 049 | [Listado de listas y crear lista](049-ui-listas.md) | ☐ |
| 050 | [Detalle de una lista](050-ui-detalle.md) | ☐ |
| 051 | [Editar y eliminar artículo](051-ui-articulo-editar.md) | ☐ |
| 052 | [Renombrar y borrar lista](052-ui-lista-editar.md) | ☐ |
| 053 | [Vaciar los comprados](053-ui-vaciar-comprados.md) | ☐ |
| 054 | [Buscador dentro de la lista](054-ui-buscador.md) | ☐ |
| 055 | [Estados vacíos](055-ui-estados-vacios.md) | ☐ |
| 056 | [Editar el nombre visible propio](056-ui-nombre-visible.md) | ☐ |
| 057 | [Ergonomía táctil](057-ui-tactil.md) | ☐ |

### Frontend · PWA y despliegue

| # | Tarea | Estado |
|---|---|---|
| 058 | [PWA: manifest y service worker](058-pwa.md) | ☐ |
| 059 | [Iconos de la aplicación](059-iconos.md) | ☐ |
| 060 | [Desplegar y obtener la URL](060-desplegar.md) | ☐ |
| 061 | [Cerrar la redirección abierta](061-cerrar-redirect-urls.md) | ☐ |
| 062 | [Probar el redirect de OAuth en la PWA instalada](062-probar-oauth-pwa.md) | ☐ |
| 063 | [Usarla una semana haciendo la compra](063-usar-de-verdad.md) | ☐ |

---

## ⚠️ Lo que todavía NO está probado

Todo lo verificado hasta ahora corrió **como administrador, y el administrador se salta la seguridad
de fila**. Las políticas de RLS están escritas, aplicadas y **sin estrenar**: no había ningún usuario
con quien probarlas.

Eso deja sin verificar precisamente la parte de la que depende toda la privacidad del producto. El
procedimiento completo, con los comandos listos para copiar, está en
[`../06-Pruebas-tras-el-primer-login.md`](../06-Pruebas-tras-el-primer-login.md), y cierra las tareas
016, 023, 024 y 025.

---

## Los riesgos vivos

1. **[062](062-probar-oauth-pwa.md) — El redirect de OAuth en la PWA instalada.** El mayor del MVP,
   porque cruza los dos requisitos que definen el producto: entrar y ser una app instalada. Solo se
   detecta en el móvil, con la app instalada.
2. **[061](061-cerrar-redirect-urls.md) — La redirección abierta.** Así viene el proyecto de fábrica.
   Permite robar una sesión con un enlace preparado. No bloquea desarrollo; bloquea publicar.
3. **[044](044-colecciones.md) — Direct writes pisados por el refetch.** Documentado, no un fallo. Si
   se pasa por alto produce el peor tipo de bug: intermitente y sin patrón.
4. **[022](022-retencion-mensajes.md) — `realtime.messages` como segunda copia de datos privados.**

## Riesgos ya cerrados

| Riesgo original | Resultado |
|---|---|
| Triggers y `SECURITY DEFINER` | ✅ Permitidos. |
| Regla de seguridad de fila del hogar | ✅ Expresable. `auth.uid()` existe. |
| Realtime de InsForge | ✅ Existe. Es pub/sub, no streaming: cambió el patrón, no la decisión. |
| Correo de recuperación de contraseña | ❌ No lo hay. Resuelto **eliminando el requisito**: se delega en Google. |

El último no se cerró comprobando que funcionaba, sino **cambiando el producto para no
necesitarlo**. Es la forma más barata de cerrar un riesgo: quitar de en medio lo que dependía de él.

## Fuera del camino crítico

Nada espera a estas. Se hacen cuando molesten lo suficiente.

- Visibilidad de errores del frontend. Se revisa antes del módulo 2, donde un error silencioso puede
  ser un importe mal calculado.
- Despliegue automatizado.
- Modo oscuro.
- Flujo de invitación.
- Limitar los intentos de unirse a un hogar.
