# Plan de trabajo — Módulo 1

**Versión:** 3.0
**Fecha:** 20 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`

---

## Cómo leer este documento

| Marca | Significado |
|---|---|
| 🔴 | Bloqueante. Hay tareas esperando a esta. |
| 🟡 | No bloqueante, pero dentro del alcance del MVP. |
| ⚪ | Prescindible. Se puede recortar sin dañar el MVP. |
| ⚠️ | Riesgo: puede invalidar una decisión ya tomada. |
| 👤 | **Solo lo puede hacer el usuario.** Cuenta, consola o dispositivo físico. |

**Primero el backend entero, después el frontend.** No por gusto por el orden, sino porque el
frontend consume un esquema, unas políticas y unos eventos que tienen que existir antes. Escribir
`useArticulos` contra una tabla que todavía no tiene RLS es escribir dos veces.

---

## A0 — Punto de partida verificado

Comprobado el 20 de agosto de 2026 con el MCP de InsForge contra el proyecto real.

| Hecho | Estado | Consecuencia |
|---|---|---|
| URL del proyecto | `https://rn8y8xbv.eu-central.insforge.app` | Es el `baseUrl` del cliente. |
| Proveedores OAuth | `google`, `github` disponibles | RF-1.1 es implementable. |
| SMTP | **Deshabilitado** | Confirma que no hay correo de recuperación. La decisión de delegar en Google era la correcta. |
| `allowedRedirectUrls` | **Vacío** | ⚠️ El login OAuth **fallará** hasta que se rellene. Tarea A1.2. |
| `requireEmailVerification` | `true`, con SMTP apagado | ⚠️ Hay que confirmar que no bloquea el alta por OAuth. Tarea A1.3. |
| Tablas | **Ninguna** | El esquema está por aplicar entero. |
| Triggers y `SECURITY DEFINER` | Permitidos | La auditoría se implementa como está diseñada. |
| `auth.uid()` | Existe | Es la función de usuario autenticado. Cierra una pregunta abierta del esquema. |
| Realtime | Pub/sub sobre canales, **no** streaming de tablas | Cambia el patrón. Ver apartado 4.1 del stack. |
| `run-raw-sql` por MCP | Disponible | El DDL se aplica desde aquí, sin copiar y pegar en la consola. |

---

# PARTE A — Backend (InsForge)

## A1 — Acceso y autenticación

- [ ] **A1.1** 🔴👤 Crear el cliente OAuth de **Google** en Google Cloud Console: pantalla de
      consentimiento y client ID + secret. Es tu cuenta, no lo puedo hacer yo.
- [ ] **A1.2** 🔴👤 Configurar el proveedor Google en InsForge con ese client ID, y **rellenar
      `allowedRedirectUrls`** con los dos orígenes: el de desarrollo local y el de producción. Ahora
      mismo la lista está vacía y **cualquier intento de login será rechazado**.
- [ ] **A1.3** 🔴 Comprobar que `requireEmailVerification: true` **no bloquea el alta por OAuth**.
      Google entrega el email ya verificado, así que no debería, pero con el SMTP apagado un usuario
      atrapado en "sin verificar" no tendría forma de salir. Si bloquea, se desactiva el flag.
- [ ] **A1.4** 🔴 Obtener la **anon key** y dejar anotados `baseUrl` y `anonKey` para el frontend.
      ⚠️ La anon key va en una variable `VITE_` y **acaba en el bundle público**: eso es correcto
      porque quien protege los datos es RLS. Una clave de servicio ahí **jamás**.
- [ ] **A1.5** 🟡 Entrar una vez con Google y **anotar la forma real de la fila de usuario**: nombre
      del esquema, nombre de la tabla y qué campos trae (nombre visible, avatar). El esquema de
      `05-Esquema-BD.md` asume `auth.users`, y hay que confirmarlo antes de escribir las FK.

## A2 — Tablas

Se aplican con `run-raw-sql`. El DDL completo está en `05-Esquema-BD.md`.

- [ ] **A2.1** 🔴 `households`: `id`, `name` y las cuatro columnas de auditoría.
- [ ] **A2.2** 🔴 `household_members`: PK uuid propia, `household_id`, `user_id`, `display_name`,
      `UNIQUE (household_id, user_id)`. La PK es propia y no compuesta **porque `audit_log.row_id`
      necesita un uuid por fila**.
- [ ] **A2.3** 🔴 `shopping_lists`, incluida la restricción `UNIQUE (id, household_id)`. Parece
      redundante sobre una PK, y no lo es: es lo que hace posible la FK compuesta de A2.4.
- [ ] **A2.4** 🔴 `shopping_items`, con `household_id` desnormalizado y la **FK compuesta**
      `(list_id, household_id) → shopping_lists (id, household_id)`. Eso hace que la base de datos
      garantice por sí sola que un artículo no puede colgar de una lista de otro hogar.
- [ ] **A2.5** 🔴 El `CHECK` `comprado_coherente`: si `is_bought` es falso, `bought_at` y `bought_by`
      tienen que estar vacíos. Es lo que impide que desmarcar deje basura.
- [ ] **A2.6** 🟡 Verificar el esquema aplicado con `get-table-schema` tabla por tabla.

## A3 — Auditoría

- [ ] **A3.1** 🔴 Función `set_auditoria()`: rellena `updated_at` y `updated_by := auth.uid()`.
- [ ] **A3.2** 🔴 Trigger `BEFORE INSERT OR UPDATE` con esa función en las cuatro tablas.
      **El cliente nunca manda `updated_by`.** Si lo mandara podría mentir, y una auditoría en la que
      se puede mentir no es una auditoría.
- [ ] **A3.3** 🔴 Tabla `audit_log`.
- [ ] **A3.4** 🔴 Función `registrar_auditoria()`, marcada **`SECURITY DEFINER`**.
- [ ] **A3.5** 🔴 Trigger `AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW` en las cuatro tablas.
- [ ] **A3.6** 🟡 **Probar el cascade:** crear una lista con tres artículos, borrar la lista, y
      comprobar que quedan **cuatro apuntes** en `audit_log`, cada uno con su `old_data` completo.
      Es la prueba de que el borrado físico no pierde información.

## A4 — Seguridad de fila

Este bloque es el criterio de aceptación 12 y la única garantía de privacidad del producto.

- [ ] **A4.1** 🔴 `ENABLE ROW LEVEL SECURITY` en las cinco tablas. Sin esto, las políticas no se
      aplican y todo lo demás es decorativo.
- [ ] **A4.2** 🔴 Política única de miembro del hogar para `SELECT`, `INSERT`, `UPDATE` y `DELETE`
      sobre las cuatro tablas de datos:
      `household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())`.
- [ ] **A4.3** 🔴 Política de `household_members`: un miembro ve a los miembros de sus hogares.
- [ ] **A4.4** 🔴 `audit_log`: **solo `SELECT`** para los miembros del hogar. Sin política de
      `INSERT`, `UPDATE` ni `DELETE` **para nadie**. Escribe solo el trigger. Criterio 14.
- [ ] **A4.5** 🔴⚠️👤 **Probar el aislamiento con dos usuarios de verdad.** Crear un segundo hogar
      con otra cuenta e intentar leer y escribir nuestras filas. Tiene que fallar en los cuatro
      verbos. Probarlo con un solo usuario no demuestra nada.

## A5 — Realtime

Ojo aquí: **InsForge no hace streaming automático de cambios de tabla.** Es pub/sub sobre canales, y
los eventos de base de datos los publicamos nosotros desde un trigger. Ver apartado 4.1 del stack.

- [ ] **A5.1** 🔴 Crear el patrón de canal `household:%` en `realtime.channels`. Un canal por hogar:
      el filtrado por hogar **no se programa, es la dirección del canal**.
- [ ] **A5.2** 🔴 Función `publicar_cambio()` `SECURITY DEFINER` que llame a
      `realtime.publish('household:' || household_id, '<evento>', <fila en jsonb>)`.
- [ ] **A5.3** 🔴 Triggers de publicación en `shopping_lists` y `shopping_items`, con nombres de
      evento `list.insert`, `list.update`, `list.delete` y los tres equivalentes de `item`.
      En `DELETE` el payload sale de `OLD`, no de `NEW`.
- [ ] **A5.4** 🔴 RLS de **suscripción**: política `SELECT` sobre `realtime.channels` que use
      `realtime.channel_name()` para extraer el uuid del hogar y comprobar la pertenencia. Sin esto,
      el realtime está abierto por defecto y cualquiera escucha cualquier hogar.
- [ ] **A5.5** 🔴 **Bloquear la publicación desde el cliente:** RLS en `realtime.messages` sin
      política de `INSERT`. Si el cliente pudiera publicar, podría inyectar en la pantalla del otro
      un cambio que nunca pasó por la base de datos ni por RLS.
- [ ] **A5.6** 🟡⚠️ Fijar `retention_days` corto en `realtime.config`. **Los payloads se guardan en
      `realtime.messages`**, así que el texto de los artículos acaba duplicado ahí. Es una segunda
      copia de datos privados con sus propias reglas.
- [ ] **A5.7** 🔴 Capturar la **forma exacta** de un evento recibido: nombres de campos y qué llega
      dentro de `meta`. De eso depende cómo se escribe el traductor a direct writes.

## A6 — Datos iniciales

- [ ] **A6.1** 🔴 Crear el hogar y su lista "La compra".
- [ ] **A6.2** 🔴👤 **Dar de alta a los dos miembros a mano** en `household_members`. No hay flujo de
      invitación en el MVP (tarea 0.4, decidida). No es una pantalla, es una fila —  pero **bloquea
      la validación de todo el tiempo real**: con un solo miembro, los criterios 3 a 6 no se pueden
      probar.

---

# PARTE B — Frontend

## B1 — Andamiaje

- [ ] **B1.1** 🔴 `pnpm` + Vite + React + TypeScript.
- [ ] **B1.2** 🔴 `.gitignore`. ⚠️ Comprobar que cubre **`.env` a secas**: la plantilla de Vite trae
      `*.local`, que no es lo mismo. Antes de escribir la primera clave.
- [ ] **B1.3** 🔴 **Alias `@/` → `src/` en `vite.config.ts` Y en `tsconfig.json`.** En los dos. Si
      falta en uno, TypeScript y Vite discrepan y la CLI de shadcn falla.
- [ ] **B1.4** 🔴 Tailwind CSS **fijado en 3.4**, mobile-first. **No subir a la 4:** es requisito
      explícito de InsForge. Anclar la versión en `package.json`.
- [ ] **B1.5** 🔴 `shadcn/ui init`, con los componentes generados apuntando a `src/shared/ui`.
- [ ] **B1.6** 🔴 Vitest + `@testing-library/react` + `user-event` + jsdom, y `src/test/setup.ts`.
      Va **antes** del primer dominio: sin runner no hay TDD.
- [ ] **B1.7** 🔴 Esqueleto de carpetas del apartado 2 de `03-Arquitectura.md`.
- [ ] **B1.8** ⚪ Lint y formateo. Nada espera a esto.

## B2 — Cliente, sesión y rutas

- [ ] **B2.1** 🔴 `@insforge/sdk` y cliente en `src/shared/api` con `baseUrl` y `anonKey` desde
      variables `VITE_`.
- [ ] **B2.2** 🔴 TanStack Router con el árbol de rutas raíz en `src/app`.
- [ ] **B2.3** 🔴 `QueryClientProvider` y las colecciones de TanStack DB con `query-db-collection`.
- [ ] **B2.4** 🔴 Entrar con Google y cerrar sesión. **Una sola pantalla:** con OAuth, registrarse e
      iniciar sesión son la misma acción.
- [ ] **B2.5** 🔴 Persistencia de sesión y protección de rutas: la app no pide login en cada apertura.
- [ ] **B2.6** 🟡 Estado de carga mientras se resuelve la sesión, para que no parpadee el login.

## B3 — Dominio (TypeScript puro: cero React, cero InsForge)

Va antes que la infraestructura. Si un archivo de `domain/` necesita un mock para testearse, está
mal colocado.

- [ ] **B3.1** 🔴 `domain/lista.ts`: tipo y reglas del nombre.
- [ ] **B3.2** 🔴 `domain/articulo.ts`: tipo, marcar y desmarcar —incluido limpiar `bought_at` y
      `bought_by` al desmarcar— y la regla de orden: pendientes primero, luego por incorporación.
- [ ] **B3.3** 🔴 `domain/busqueda.ts`: normalización que ignora mayúsculas y acentos, para que
      `azucar` encuentre `Azúcar` (RF-1.6).

## B4 — Infraestructura

- [ ] **B4.1** 🔴 Repositorios de listas y artículos contra InsForge, devolviendo tipos de dominio.
      Sin filtros de borrado: el borrado es físico. El SDK devuelve `{ data, error }` y **los insert
      van en array**.
- [ ] **B4.2** 🔴 Colecciones de TanStack DB con `queryCollectionOptions`.
- [ ] **B4.3** 🔴⚠️ **`staleTime` alto en las colecciones.** Un direct write lo pisa la siguiente
      ejecución del `queryFn`. Síntoma: un artículo borrado que reaparece solo, sin patrón.
- [ ] **B4.4** 🔴 Conexión y suscripción a `household:<uuid>` con `insforge.realtime`.
- [ ] **B4.5** 🔴 Traductor de eventos a **direct writes**: `writeInsert`, `writeUpdate`,
      `writeDelete`, agrupados en `writeBatch`. **Nunca invalidar la query al recibir un evento.**
- [ ] **B4.6** 🟡 Reconexión: refetch de las colecciones al recuperar foco. Un WebSocket caído no
      reenvía lo que se perdió.

## B5 — Aplicación

- [ ] **B5.1** 🔴 `useHogar`: hogar del usuario y sus miembros.
- [ ] **B5.2** 🔴 `useListas` con sus mutaciones optimistas.
- [ ] **B5.3** 🔴 `useArticulos` con sus mutaciones optimistas.

## B6 — Interfaz

- [ ] **B6.1** 🔴 Listado de listas, y crear lista.
- [ ] **B6.2** 🔴 Detalle de una lista: artículos, añadir, marcar y desmarcar.
- [ ] **B6.3** 🟡 Editar y eliminar artículo.
- [ ] **B6.4** 🟡 Renombrar lista.
- [ ] **B6.5** 🟡 Borrar lista, con confirmación que dice **cuántos artículos se pierden**.
- [ ] **B6.6** 🟡 Vaciar los comprados de una lista.
- [ ] **B6.7** 🟡 Buscador dentro de la lista. **El texto no entra en la query key:** es estado de
      vista, no criterio de obtención de datos.
- [ ] **B6.8** 🟡 Estado vacío cuando no hay ninguna lista.
- [ ] **B6.9** 🟡 Editar el nombre visible propio, prerrellenado con el que da Google.
- [ ] **B6.10** 🟡 Objetivos táctiles grandes y uso con una mano. No es estética: la app se usa de
      pie en un supermercado.

## B7 — PWA y despliegue

- [ ] **B7.1** 🔴 `vite-plugin-pwa`: service worker y manifest con nombre, iconos de 192 y 512 px,
      `display: standalone` y color de tema.
- [ ] **B7.2** 🟡 Iconos de la aplicación.
- [ ] **B7.3** 🔴 Desplegar con `create-deployment` y obtener la URL en vivo.
- [ ] **B7.4** 🔴👤 **Añadir la URL de producción a `allowedRedirectUrls`.** Hasta que no exista la
      URL no se puede hacer, y sin ello el login no funciona en producción.
- [ ] **B7.5** 🔴⚠️👤 **Probar el redirect de OAuth en la PWA ya instalada, en iOS y en Android.**
      Es el riesgo número 1. En el navegador de escritorio siempre funciona, así que probarlo ahí no
      demuestra nada.
- [ ] **B7.6** 🔴👤 **Instalarla en los dos móviles y usarla una semana haciendo la compra de
      verdad.** Es el único criterio de éxito que cuenta.

---

## Fuera del camino crítico

- [ ] **C1** ⚪ Visibilidad de errores del frontend. Se revisa antes del módulo 2, donde un error
      silencioso puede ser un importe mal calculado.
- [ ] **C2** ⚪ Despliegue automatizado. Manual es suficiente al principio.
- [ ] **C3** ⚪ Modo oscuro. No es alcance del MVP.
- [ ] **C4** ⚪ Flujo de invitación. Se retoma cuando el resto funcione.
- [ ] **C5** ⚪ Limitar los intentos de unirse a un hogar. Sin flujo de invitación no aplica todavía.

---

## Riesgos

### Cerrados el 20 de agosto de 2026

| Riesgo original | Resultado |
|---|---|
| Triggers y `SECURITY DEFINER` | ✅ Permitidos. |
| Regla de seguridad de fila del hogar | ✅ Expresable. `auth.uid()` existe. |
| Realtime de InsForge | ✅ Existe, pero es **pub/sub**, no streaming de tablas. Cambió el patrón, no la decisión. |
| Correo de recuperación de contraseña | ❌ **No lo hay** (SMTP deshabilitado, confirmado). Resuelto **eliminando el requisito**: se delega en Google. |

El último no se cerró comprobando que funcionaba, sino **cambiando el producto para no necesitarlo**.
Es la forma más barata de cerrar un riesgo: quitar de en medio lo que dependía de él.

### Vivos

1. **B7.5 — El redirect de OAuth en la PWA instalada.** El mayor del MVP, porque cruza los dos
   requisitos que definen el producto: entrar y ser una app instalada. Una PWA en
   `display: standalone` puede mandar el redirect al navegador del sistema y dejar allí la sesión.
   Solo se detecta en el móvil, con la app instalada.
2. **B4.3 — Direct writes pisados por el refetch.** Documentado, no un fallo. Se controla con
   `staleTime`. Si se pasa por alto produce el peor tipo de bug: intermitente y sin patrón.
3. **A5.6 — `realtime.messages` como segunda copia de datos privados.** El modelo de privacidad dice
   que los datos solo los ven los miembros del hogar; esa tabla los duplica. RLS y retención corta.

**Regla de oro:** la parte A entera antes de la parte B. El frontend consume un esquema, unas
políticas y unos eventos. Escribirlo antes de que existan es escribirlo dos veces.
