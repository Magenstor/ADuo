# Decisiones técnicas y stack

**Versión:** 3.0
**Fecha:** 20 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`

Decisiones transversales al producto entero, no de un módulo concreto. El modelo de datos y el
orden de implementación **no viven aquí**: se definen módulo a módulo, en el documento de cada uno.

---

## 1. Resumen del stack (decidido)

| Capa | Tecnología |
|---|---|
| Frontend | React (PWA) |
| Backend / BD / Auth / Realtime | InsForge cloud, plan Free |
| Hosting del frontend | Hosting de InsForge |
| Idioma / moneda | Español / EUR |

## 2. Frontend

### 2.1 Base del proyecto

- **Gestor de paquetes: pnpm.**
- **React 18+ con Vite** como bundler. Arranque rápido, build ligero, ecosistema estándar.
- **TypeScript.** En una app que va a manejar dinero, tipar importes, porcentajes y balances evita
  errores tontos.
- **PWA con `vite-plugin-pwa`:** genera el service worker y el manifest.

### 2.2 Política de librerías

**Se prefiere el ecosistema TanStack siempre que la pieza que necesitamos esté madura.** La
madurez es parte de la política, no una excepción a ella: preferir TanStack por coherencia y
acabar dependiendo de un paquete pre-alfa es peor que usar una librería externa consolidada. La
regla práctica es simple: **1.0 o superior entra; 0.x se justifica una por una.**

### 2.3 Librerías decididas

| Necesidad | Elección | Estado |
|---|---|---|
| Routing | `@tanstack/react-router` | Maduro |
| Datos y caché | `@tanstack/react-query` | Maduro |
| Tiempo real y estado reactivo | `@tanstack/react-db` + `@tanstack/query-db-collection` | 0.x — adoptado con los ojos abiertos, ver 2.5 |
| Formularios | `@tanstack/react-form` | Maduro |
| Tablas (módulo 2) | `@tanstack/react-table` | Maduro |
| Componentes de interfaz | **shadcn/ui** | Maduro |
| Gráficos (módulo 2) | `recharts` | Maduro. **No** TanStack Charts, ver abajo |
| Fechas | `date-fns` | Maduro |
| Estilos | Tailwind CSS **3.4**, mobile-first | Maduro |

Descartados del ecosistema TanStack: **Virtual** (listas pequeñas), **Store** (DB ya cubre el
estado) y **Start** (SSR innecesario para una PWA estática; TanStack DB además no soporta SSR, las
colecciones cargan en cliente).

**Proporcionalidad:** el módulo 1 necesita router, query, db, query-db-collection, form y shadcn/ui.
Table y recharts entran con el módulo 2. No conviene instalarlo todo el primer día.

### 2.4 Gráficos: recharts, no TanStack Charts

Verificado el 17 de agosto de 2026:

- `TanStack/react-charts`, la librería original, está **archivada desde el 13 de mayo de 2026**.
  Sin mantenimiento, sin correcciones, sin soporte.
- `TanStack/charts`, su sucesora, va por la **0.14.0 y se declara pre-alfa y no apta para
  producción**, con la API sujeta a cambios entre versiones.

Los gráficos no llegan hasta el módulo 2, así que la decisión se puede revisar entonces. Si
TanStack Charts ha alcanzado una versión estable en ese momento, se reconsidera. Mientras tanto la
elección es recharts, y el criterio es el del apartado 2.2: la coherencia de ecosistema no compra
una dependencia pre-alfa.

### 2.5 Tiempo real: TanStack DB desde el módulo 1

**Qué hace realmente cada pieza.** Un WebSocket es transporte: entrega un evento
(`{type, table, row}`) y se desentiende. Todo lo demás es trabajo propio, y son cuatro problemas
distintos:

1. **Dónde va la fila.** Hace falta un almacén en cliente y empalmar la fila en el sitio correcto,
   para insert, update y delete.
2. **Escritura optimista y rollback.** Ver el cambio propio al instante, deshacerlo si el servidor
   lo rechaza, y desduplicar el evento de la propia escritura cuando llega de vuelta.
3. **Estado derivado.** Recalcular lo que depende de los datos cuando estos cambian.
4. **Reconexión.** Un WebSocket caído no reenvía los eventos perdidos: hace falta refetch y
   reconciliación al volver.

TanStack Query cubre 1, 2 y 4: las mutaciones optimistas con rollback son función propia, y volcar
el evento de realtime a la caché son unas decenas de líneas. **El problema 3 es el que justifica
TanStack DB**, y con él un segundo problema que aparece en cuanto hay filtros (ver más abajo).

**Decisión: se adopta TanStack DB desde el módulo 1**, sobre `query-db-collection` y con la
suscripción de InsForge alimentando la colección. Decidido el 17 de agosto de 2026.

*Criterio:* la aplicación es de tiempo real y se apoya en colecciones, que es exactamente el caso de
uso que TanStack DB declara resolver. Se prefiere probarla en el módulo más simple antes que
introducirla más tarde sobre la lógica del dinero.

*Qué se gana en el módulo 1, concretamente:* el problema 2 —desduplicar el eco de la propia
escritura optimista cuando vuelve por realtime— deja de ser código propio y pasa a ser
responsabilidad de la librería. También el buscador de RF-1.6 sale como live query sobre la
colección en lugar de un `useMemo` sobre el array de la caché.

*Con los ojos abiertos:* nada de esto es **necesario** a la escala de ADuo, según el análisis de más
abajo. Es una elección deliberada de comodidad y de aprendizaje, no una exigencia técnica. Queda
registrado para que dentro de seis meses no se lea como si lo hubiera impuesto un requisito.

**Un filtro no es una caché: filtrar en cliente o en servidor es una decisión propia.** La explosión
de cachés no la causa "tener filtros", la causa **elegir filtrar en el servidor**. Un buscador que
filtra un array ya cargado en memoria no crea ninguna entrada de caché, no pega al servidor y es
instantáneo. Solo explota si el criterio entra en la query key.

Regla general del proyecto, por tanto: **el filtro entra en la query key solo si decide qué datos se
piden al servidor.** El texto de un buscador nunca lo hace. Ver RF-1.6 en
`01-Modulo-1-Lista-Compra.md`.

**Los dos motivos que TanStack DB resolvería en el módulo 2** — y la honestidad de decir que
**ninguno de los dos está garantizado a la escala de ADuo**:

- **Estado derivado.** El balance se deriva de todos los gastos. TanStack DB hace live queries
  incrementales: recalcula solo lo que cambió, en lugar de rehacer el total en cada evento.
- **Colapso de la explosión de cachés.** En TanStack Query los filtros forman parte de la key, así
  que cada combinación es una caché distinta. El historial del módulo 2 filtra por mes, categoría y
  quién pagó: tres dimensiones. Una inserción optimista obliga a parchear todas las cachés donde la
  fila debería aparecer, o a invalidarlas y refetch, que es renunciar al optimismo.

  TanStack DB no sincroniza esas N cachés: **las elimina.** Hay una sola colección con las filas y
  los filtros pasan a ser proyecciones derivadas de ella, calculadas en cliente. Se escribe una vez
  y todas las vistas se actualizan.

  *Condición de validez:* esto solo funciona si el conjunto de trabajo cabe en el cliente. Con una
  colección parcial, una live query no puede responder por filas que no tiene. En ADuo se cumple
  con holgura: dos personas y volumen doméstico son unos miles de filas en años.

  *Pero justo por eso el motivo se debilita:* si todos los gastos caben en memoria, se pueden cargar
  una vez y filtrarlos en cliente con TanStack Query a secas, exactamente como el buscador del módulo
  1. La explosión de cachés se evita eligiendo bien, no comprando una librería.

**Verdad incómoda: TanStack DB puede no justificarse nunca en ADuo.** Sus tres ventajas declaradas
—colecciones normalizadas contra la proliferación de endpoints, live queries de menos de un
milisegundo y reactividad de grano fino— resuelven problemas de escala. Con dos usuarios y unos
miles de filas, un `reduce` para recalcular el balance tarda microsegundos y no hay endpoints que
proliferen. A esta escala DB es una comodidad, no una necesidad.

Esto no revoca la decisión: la enmarca. Se adopta sabiendo que la justificación es comodidad y no
escala, y por tanto **abandonarla nunca será una derrota técnica**, solo un cambio de opinión sobre
la comodidad.

**Cómo se sale, si hay que salir — y la salida no es simétrica.**

**TanStack DB no sustituye a TanStack Query, la extiende.** Su propia documentación lo dice
literalmente — *"extends TanStack Query with collections, live queries and optimistic mutations"*— y
el puente es `queryCollectionOptions`, que recibe `queryKey`, `queryFn` y `queryClient`: primitivas
de TanStack Query.

De ahí se sigue algo que hay que tener claro antes de empezar:

- **Query → DB es aditivo.** Se envuelve el `queryFn` que ya existe. Barato.
- **DB → Query es deshacer.** Las `useLiveQuery`, las colecciones y las transacciones optimistas no
  tienen equivalente directo: hay que reescribirlas a `useQuery` más parcheo manual de caché.

Es decir, **la vuelta cuesta más que la ida.** Lo que acota el daño es que
`queryCollectionOptions` **exige un `queryFn` de todas formas**, así que el acceso a datos con forma
de Query se escribe igual, y que ese código vive confinado en `infrastructure/` con los hooks en
`application/` (ver `03-Arquitectura.md`). El dominio no se entera de nada de esto.

**Compromiso de contención:** ninguna capa fuera de `infrastructure/` y `application/` importa nada
de `@tanstack/react-db`. Los componentes de `ui/` consumen los hooks del módulo, nunca colecciones
ni live queries directamente. Es lo que mantiene el coste de salida acotado, y es una regla que se
rompe sola si no se vigila.

**Versiones publicadas, comprobadas el 17 de agosto de 2026:**

| Paquete | Versión |
|---|---|
| `@tanstack/react-query` | 5.101.4 |
| `@tanstack/query-db-collection` | 1.2.4 |
| `@tanstack/db` | 0.7.2 |
| `@tanstack/react-db` | 0.2.1 |

La pieza a vigilar es **`@tanstack/react-db` (0.2.1)**, que es la que se importaría en React y la
más temprana de todas. A diferencia de TanStack Charts, la documentación de DB **no advierte contra
su uso en producción**; la cautela aquí es el pre-1.0 del binding de React, no un aviso explícito
del proyecto.

### 2.5b Tailwind se fija en 3.4, no en 4.x

La documentación de InsForge lo marca como requisito explícito: **usar Tailwind CSS 3.4 y no subir a
la 4**, con la dependencia fijada en `package.json`. No es una preferencia nuestra, es una
restricción del proveedor sobre el que vamos a desplegar, así que se acata y se ancla la versión.

### 2.6 shadcn/ui

Elegido por comodidad y por ser el estándar de facto actual. Dos consecuencias que hay que tener
presentes, porque afectan a la arquitectura:

- **No es una dependencia, es un generador.** Los componentes se copian dentro del repositorio, así
  que pasan a ser código propio que se mantiene. Necesitan un sitio definido en la estructura de
  carpetas y no deben mezclarse con los componentes de dominio de la aplicación.
- **Encaja con lo ya decidido:** se apoya en Tailwind, y su receta de tabla de datos está construida
  sobre TanStack Table. Requiere alias de rutas configurados en Vite y TypeScript.

### 2.3 Manejo de dinero

Aplica desde el módulo 2, pero se fija aquí porque es una decisión transversal e irreversible en
la práctica.

- Los importes se almacenan y calculan en **céntimos (enteros)**, nunca en coma flotante. Solo se
  formatea a euros en la capa de presentación, con
  `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.
- Al repartir un importe, la parte de un miembro se calcula con redondeo y la del otro como resto,
  para que las partes sumen siempre el total exacto y no se pierda ni se invente un céntimo.

## 3. Backend: InsForge

### 3.1 Servicios que usamos

- **PostgreSQL** con API REST autogenerada y seguridad a nivel de fila (RLS).
- **Autenticación** delegada a un proveedor de identidad externo (Google). Sin contraseñas
  propias. Ver el apartado 3.3.
- **Realtime:** suscripción a cambios en las tablas del hogar.
- **Hosting** del frontend con URL en vivo.

InsForge es open source (Apache-2.0) y autoalojable con Docker, lo que mitiga la dependencia de
proveedor. La base es PostgreSQL estándar, así que los datos son exportables.

> **Validado el 20 de agosto de 2026:** InsForge permite triggers y funciones `SECURITY DEFINER`,
> la regla de seguridad de fila del hogar se puede expresar, y el realtime se expone por WebSocket.
> Los tres riesgos que bloqueaban este apartado están cerrados. Ver el bloque 1 de
> `04-Plan-de-trabajo.md`.

### 3.2 Seguridad

- Regla única y central: un usuario solo puede leer y escribir filas cuyo `household_id`
  corresponda a un hogar del que es miembro. Se aplica en el backend, nunca solo en el cliente.
- Sin límite de miembros y sin flujo de invitación en el MVP: las altas se hacen a mano en la
  consola. Ver apartado 4.1 de `05-Esquema-BD.md`.
- `audit_log` es de solo añadir: lectura para los miembros del hogar, escritura solo por trigger
  `SECURITY DEFINER`. Ver apartado 6 de `05-Esquema-BD.md`.

### 3.3 Autenticación: OAuth de terceros, sin contraseñas

**Decisión del 20 de agosto de 2026.** ADuo no gestiona contraseñas. El acceso se delega en un
proveedor de identidad externo a través de InsForge, empezando por **Google**.

**Motivo.** El plan Free de InsForge no envía correo de recuperación de contraseña, y RF-1.1 exigía
poder recuperar el acceso. Sin correo, un login con contraseña propia es una trampa: el día que
alguien la olvide pierde el hogar entero. Delegar en Google elimina el requisito en lugar de
incumplirlo.

**Lo que desaparece del producto,** y esto es la mitad del valor de la decisión:

- La pantalla de registro separada de la de acceso: con OAuth son la misma acción.
- El flujo de recuperación de contraseña completo.
- La decisión sobre verificación de email: el proveedor ya entrega el email verificado.
- El almacenamiento y el hasheo de contraseñas, y con ello toda esa superficie de ataque.

**Lo que se acepta a cambio.** Dependencia de un tercero: si Google no responde, no se entra. A esta
escala es un riesgo menor que el propio plan Free, y se contiene añadiendo un segundo proveedor el
día que haga falta.

**Apple queda fuera del MVP.** Requiere el Apple Developer Program, de pago anual, y no aporta nada
que Google no cubra para este hogar. La regla de App Review que obliga a ofrecer *Sign in with Apple*
cuando ya se ofrecen otros logins sociales **no aplica aquí**, porque una PWA instalada desde el
navegador no pasa por App Review. Si algún día se empaqueta para la App Store, entonces sí habría
que añadirlo.

**Google ya viene configurado de fábrica** (verificado el 20 de agosto de 2026). La tabla
`auth.oauth_configs` trae la fila de `google` con `use_shared_key: true`, sin cliente propio, y con
los scopes `openid`, `email` y `profile`. **No hay que dar de alta nada en Google Cloud Console para
empezar a entrar.**

InsForge fija `client_id`, `redirect_uri`, `scope`, `state` y `code_challenge` **en el servidor** e
ignora los que mande el cliente. Por eso la clave compartida funciona: ante Google, quien pide el
consentimiento es InsForge. El precio es que **la pantalla de consentimiento mostrará el nombre de
InsForge, no "ADuo"** — irrelevante para un hogar de dos, inaceptable para cualquier cosa pública.

Migrar a un cliente propio más adelante **no rompe datos**: `auth.users.id` es un uuid de InsForge,
no el identificador de Google, y el enlace con el proveedor vive aparte en `auth.user_providers`.
Nuestras claves ajenas apuntan a algo estable.

**Consecuencias técnicas de obligado cumplimiento:**

- `signInWithOAuth` exige un **`redirectTo`**, y el SDK detecta solo el `insforge_code` de vuelta,
  canjea la sesión y la guarda. El flujo es **PKCE**. El refresco va en una cookie `httpOnly`.
- ⚠️ **`allowedRedirectUrls` vacío permite CUALQUIER redirección**, y así viene el proyecto de
  fábrica. Es una redirección abierta y hay que cerrarla antes de producción: con la lista vacía,
  cualquiera puede fabricar un enlace de login que mande el `insforge_code` a su propio servidor y
  canjearlo por una sesión con la cuenta de la víctima. Tarea A1.2 del plan.
- El **nombre visible y el avatar** llegan en `profile.name` y `profile.avatar_url`, así que
  `display_name` se rellena solo la primera vez. Sigue siendo editable por su dueño (RF-1.2).
- **Cerrar sesión es local.** Salir de ADuo no cierra la sesión de Google en el dispositivo.
- El esquema **no cambia**: `auth.uid()` sigue siendo la identidad y `household_members.user_id`
  sigue apuntando al usuario del proveedor de auth.

⚠️ **Riesgo abierto: el redirect de OAuth en la PWA instalada.** Una PWA en `display: standalone`
puede abrir el redirect fuera del contexto de la aplicación, en el navegador del sistema, dejando la
sesión donde no sirve. Hay que probarlo **en el móvil con la app instalada**, no en el navegador de
escritorio, donde siempre funciona. Ver la tarea 3.3 de `04-Plan-de-trabajo.md`.

## 4. Realtime — patrón de integración

La decisión de qué librería sostiene el tiempo real está en el apartado 2.5. Aquí va el patrón
concreto. Todo esto vive en la capa `infrastructure/` del módulo correspondiente y en ninguna otra.

### 4.1 Cómo funciona el realtime de InsForge (verificado el 20 de agosto de 2026)

**No es streaming automático de cambios de tabla.** Esto es lo primero que hay que entender, porque
la intuición traída de Supabase es justo la equivocada: en InsForge **no existe** un
"suscríbete a los cambios de `shopping_items`". El realtime es **pub/sub sobre canales con nombre**.

El mecanismo real, según la documentación oficial:

1. Se declaran **patrones de canal** en `realtime.channels`. Los patrones usan `LIKE` de SQL, con `:`
   como separador y `%` como comodín: `household:%` resuelve a `household:<uuid>`.
2. **Un trigger en la tabla** llama a `realtime.publish(canal, evento, payload)`. Es decir: los
   eventos de base de datos **los publicamos nosotros**, eligiendo canal, nombre de evento y
   contenido.
3. Postgres emite `pg_notify`, el backend carga el mensaje y lo entrega por Socket.IO a los
   suscriptores del canal.

**Para ADuo esto encaja mejor de lo que parecía**, porque el canal reproduce exactamente la regla de
seguridad que ya teníamos: **un canal por hogar**, `household:<uuid>`. El filtrado por hogar no hay
que programarlo, es la dirección del canal.

| Pieza | Cómo se resuelve en ADuo |
|---|---|
| Canal | Patrón `household:%`, resuelto como `household:<household_id>` |
| Publicación | Trigger `SECURITY DEFINER` en `shopping_lists` y `shopping_items` |
| Nombre de evento | `list.insert`, `list.update`, `list.delete`, y lo mismo para `item` |
| Payload | La fila entera en `jsonb`, que es lo que necesita un direct write |
| Quién puede escuchar | Política `SELECT` sobre `realtime.channels` con `realtime.channel_name()` |
| Quién puede publicar | **Nadie desde el cliente.** Solo el trigger |

**El cliente nunca publica.** Las escrituras van por PostgREST a la tabla, el trigger publica, y el
evento vuelve a todos. Si el cliente pudiera publicar, podría inyectar en la colección del otro un
cambio que nunca pasó por la base de datos ni por RLS.

### 4.2 Reparto de capas en el frontend

**El WebSocket no se conecta "a través de" TanStack Query.** Query no tiene transporte de WebSocket y
no lo pretende. El reparto es:

| Capa | De qué se encarga |
|---|---|
| TanStack Query | La **carga inicial** de cada colección (`queryFn`) y el refetch al recuperar foco o reconectar. Nada más. |
| `insforge.realtime` | Los **cambios posteriores**, que llegan por Socket.IO y se aplican a mano. |
| TanStack DB | Guarda el estado, resuelve las live queries de forma incremental y gestiona las mutaciones optimistas. |

Cada evento se traduce a un **direct write** de TanStack DB —`collection.utils.writeInsert`,
`writeUpdate`, `writeDelete`, agrupados en `writeBatch`—, que es el mecanismo que la librería
documenta para fuentes externas en tiempo real.

**Nunca se invalida la query al recibir un evento.** Invalidar dispara un refetch completo de la
tabla por cada fila que cambia, que es justo lo que este montaje existe para evitar.

### 4.3 Dos trampas confirmadas

⚠️ **1. Un direct write lo pisa la siguiente ejecución del `queryFn`.** Comportamiento documentado de
TanStack DB, no un fallo: el `queryFn` devuelve el estado completo del servidor y sobrescribe la
colección, incluido lo que el WebSocket acababa de escribir.

El síntoma en producción es de los que cuestan una tarde: **un artículo borrado reaparece solo**, sin
patrón, porque depende de cuándo toque refetch. Se evita con un `staleTime` alto. Si el WebSocket es
la fuente de verdad de los cambios, el refetch periódico sobra: solo hace falta al recuperar foco o
al reconectar, que es precisamente cuando sí queremos que pise lo local.

⚠️ **2. `realtime.messages` guarda los payloads.** Los mensajes se persisten en una tabla, así que el
texto de los artículos acaba duplicado ahí. Nuestro modelo de privacidad dice que los datos solo son
visibles para los miembros del hogar, y esa tabla es una segunda copia con sus propias reglas. Dos
medidas, las dos obligatorias: **RLS sobre `realtime.messages`** y **`retention_days` corto** en
`realtime.config`.

## 5. Despliegue y entornos

- **Producción:** hosting de InsForge, mismo proyecto que el backend. Una única plataforma que
  administrar.
- **Desarrollo:** Vite en local apuntando al proyecto de InsForge. Valorar un segundo proyecto
  como entorno de pruebas si el plan lo permite; si no, prefijo de datos de prueba y limpieza
  manual.
- **Código:** repositorio en GitHub. Despliegue manual al principio, automatizable después.
- **Alternativa futura:** migrar el frontend a Vercel o Netlify es trivial por ser una app
  estática, y el backend no cambia.

## 6. Restricciones y riesgos del plan Free

- **Pausa por inactividad:** los proyectos gratuitos se pausan tras una semana sin uso. Con uso
  diario no debería ocurrir; tras vacaciones largas puede requerir reactivar el proyecto. Riesgo
  asumido; mitigación futura: plan de pago o autoalojamiento.
- **Límites:** 500 MB de base de datos y 1 GB de almacenamiento. Sobrado para dos usuarios sin
  adjuntos.

## 7. Fuera de alcance técnico

- Modo offline con cola de sincronización.
- Notificaciones push.
- Tests end-to-end automatizados. Sí se exigen tests unitarios de la lógica crítica: el reparto y
  el balance del módulo 2.
- CI/CD completo.

## 8. Observabilidad y logs

- **Logs de plataforma y base de datos: delegados en InsForge.** Autenticación, consultas y errores
  de backend se consultan en su panel. No se construye nada propio.
- **Realtime y websockets: delegados en InsForge.** No hay servidor de websockets propio.
- **Errores del frontend: sin decidir.** InsForge no cubre esto. Si la PWA revienta en el móvil de
  la otra persona, no hay forma de enterarse: no vas a mirarle la consola del navegador. Para dos
  usuarios el coste de no tenerlo es bajo —te lo cuentan— así que no bloquea el MVP, pero es una
  decisión consciente y no un olvido. Se revisa antes del módulo 2, donde un error silencioso puede
  significar un importe mal calculado.

## 9. Sin decidir todavía

- **Visibilidad de errores del frontend.** Ver apartado 8. Único punto abierto que afecta al MVP,
  y no lo bloquea.

Resueltos desde la versión anterior: la estructura de carpetas, la arquitectura de capas y las
herramientas de test están en `03-Arquitectura.md`.
