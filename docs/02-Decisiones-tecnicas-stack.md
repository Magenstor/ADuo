# Decisiones técnicas y stack

**Versión:** 2.0
**Fecha:** 17 de agosto de 2026
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
| Estilos | Tailwind CSS, mobile-first | Maduro |

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
- **Autenticación** email + contraseña, con recuperación de contraseña por email. OAuth con Google
  queda como opcional post-MVP.
- **Realtime:** suscripción a cambios en las tablas del hogar.
- **Hosting** del frontend con URL en vivo.

InsForge es open source (Apache-2.0) y autoalojable con Docker, lo que mitiga la dependencia de
proveedor. La base es PostgreSQL estándar, así que los datos son exportables.

> Pendiente de validar con un spike antes de construir sobre ello: el detalle exacto de la API de
> RLS y de realtime, que es lo que sostiene la regla de seguridad del hogar.

### 3.2 Seguridad

- Regla única y central: un usuario solo puede leer y escribir filas cuyo `household_id`
  corresponda a un hogar del que es miembro. Se aplica en el backend, nunca solo en el cliente.
- El código de invitación solo se acepta mientras el hogar tenga menos de dos miembros.

## 4. Realtime — patrón de integración

La decisión de qué librería sostiene el tiempo real está en el apartado 2.5. Aquí va el patrón
concreto. Todo esto vive en la capa `infrastructure/` del módulo correspondiente y en ninguna otra.

### 4.1 El patrón

**No existe adaptador oficial de InsForge para TanStack DB.** Ese hueco lo rellenamos nosotros, y es
el punto de mayor incertidumbre técnica del MVP:

- Una **colección por tabla del hogar**, creada con `queryCollectionOptions`: recibe `queryKey`,
  `queryFn` y `queryClient` —primitivas de TanStack Query— más `getKey` y los manejadores
  `onInsert` / `onUpdate` / `onDelete` que persisten contra InsForge.
- Suscripción a inserts, updates y deletes de InsForge, **filtrada por `household_id`**.
- Al recibir un evento del otro dispositivo, se vuelca el cambio a la colección mediante **direct
  writes**, que es el mecanismo que TanStack DB prevé para actualizaciones en tiempo real desde
  fuentes externas.
- Las live queries que dependan de esos datos se actualizan de forma incremental. El buscador de
  RF-1.6 es una de ellas.
- Los cambios propios se ven al instante por las mutaciones optimistas de la colección, con rollback
  si el servidor rechaza. **La desduplicación del eco la resuelve la librería**, no código propio.
- Fallback si se cae la conexión realtime: refetch de la query collection al recuperar el foco. Un
  WebSocket caído no reenvía lo que se perdió.

### 4.2 Riesgo y verificación previa

Que este patrón funcione depende de la forma exacta de los eventos de realtime de InsForge y de que
encajen con los direct writes de TanStack DB. **Nadie lo ha validado todavía**, y de ello dependen la
decisión del apartado 2.5 y el diseño entero de `infrastructure/`.

Por eso se verifica con un spike **antes** de montar el proyecto, no al llegar a la tarea que lo
necesita. Ver el bloque 1 de `04-Plan-de-trabajo.md`.

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
