# Módulo 1 — Listas de la compra (MVP)

**Versión:** 3.0
**Fecha:** 20 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`

---

## 1. Alcance

Listas de la compra compartidas entre los miembros del hogar. Varias listas, con nombre.

El módulo 1 entrega además toda la base transversal del producto, porque es el primero que la
necesita: acceso, hogar, sincronización en tiempo real, PWA instalable y despliegue.
Esa base es la mitad del trabajo real de este MVP.

**Explícitamente fuera:** notas libres, categorías de producto, precios, cantidades con unidades,
artículos recurrentes, plantillas de lista e historial de compras. Todo eso es mejora futura.

## 2. Requisitos funcionales

### RF-1.1 — Cuentas y acceso

- **Acceso con una cuenta de Google**, delegado en InsForge. ADuo no gestiona contraseñas.
- **Registro e inicio de sesión son la misma acción.** No hay dos pantallas: se entra con Google y,
  si es la primera vez, la cuenta se crea sola.
- Cierre de sesión.
- La sesión persiste entre aperturas de la app: no se pide login cada vez.

**Decisión del 20 de agosto de 2026 — autenticación delegada, sin contraseñas propias.** El plan
Free de InsForge no envía correo, así que una contraseña propia no se podría recuperar nunca: el día
que alguien la olvidara perdería el acceso al hogar. En vez de incumplir el requisito, se elimina.

Con esto **desaparecen del alcance** la recuperación de contraseña, la verificación de email —el
proveedor ya lo entrega verificado— y la pantalla de registro. El razonamiento y las consecuencias
técnicas están en el apartado 3.3 de `02-Decisiones-tecnicas-stack.md`.

**Apple queda fuera del MVP:** exige el Apple Developer Program, de pago anual, y no aporta nada
sobre Google para este hogar. Añadir un segundo proveedor es una tarea aislada el día que haga
falta.

### RF-1.2 — Hogar

- El primer usuario que entra crea un hogar.
- Cada miembro tiene un **nombre visible** dentro del hogar, editable por él mismo. Se rellena la
  primera vez con el nombre que entrega Google, para que nadie tenga que escribirlo al entrar.
- **Sin límite de miembros.** No hay grupo "completo".
- Un usuario pertenece **a un solo hogar**.

**Decisión del 20 de agosto de 2026 — sin flujo de invitación en el MVP.** No hay código de
invitación ni pantalla para unirse. Los miembros se dan de alta **insertando la fila de
`household_members` a mano** desde la consola de InsForge. Para dos personas que viven juntas es una
operación que se hace una vez, y construir un flujo completo —generar código, presentarlo,
introducirlo, validarlo, regenerarlo— para ejecutarla una vez es trabajo que no compra nada.

⚠️ **Pero el alta manual sigue siendo obligatoria antes de dar el MVP por bueno.** Los criterios 4
a 8 son la sincronización en tiempo real entre dos personas, que es la apuesta técnica central de
este módulo. Con un solo miembro en el hogar **no se pueden probar**. La invitación es prescindible;
tener dos miembros de verdad, no.

**Decisión — abandonar el hogar: fuera del MVP.** Es la operación con más consecuencias de todo
el producto: al llegar el módulo 2 arrastra gastos, balances y deudas pendientes de alguien que ya
no está. Resolverlo bien no es trabajo del MVP, y resolverlo mal deja datos huérfanos. Se define
cuando exista el módulo 2.

### RF-1.3 — Listas

- Cualquier miembro puede **crear** una lista dándole un nombre. El nombre es obligatorio.
- Cualquier miembro puede **renombrar** cualquier lista del hogar.
- Cualquier miembro puede **borrar** cualquier lista del hogar. Borrar una lista **borra sus
  artículos**, así que la acción pide confirmación indicando cuántos artículos se van a perder.
- Todas las listas del hogar son visibles para todos sus miembros. No hay listas privadas.
- Al crear el hogar se crea una **lista inicial llamada "La compra"**, para que la app no arranque
  vacía y se pueda usar sin configurar nada.
- Se puede borrar la última lista. En ese caso la app muestra un estado vacío que invita a crear
  una. No se inventa una regla especial de "mínimo una lista".

**Sin límite de listas** en el MVP. Nadie va a crear cuarenta, y poner un límite es código y un
mensaje de error a cambio de protegerse de un problema que no existe.

### RF-1.4 — Artículos

- **Añadir artículo** a una lista: un texto libre. Es el único campo obligatorio y el único campo.
- **Marcar como comprado** y desmarcar. Cualquier miembro puede marcar cualquier artículo, lo haya
  añadido él u otro.
- **Editar** el texto de un artículo.
- **Eliminar** un artículo.
- **Vaciar los comprados** de una lista: borra de golpe todos los artículos marcados de esa lista.
- **Mover un artículo entre listas: fuera del MVP.** Se borra y se vuelve a añadir.

### RF-1.5 — Comportamiento de la lista

- **Los artículos comprados no desaparecen.** Se muestran marcados y agrupados al final. Motivo:
  en el supermercado necesitás ver lo que ya cogiste, y necesitás poder desmarcar si te
  equivocaste. Desaparecer al marcar hace la app inutilizable justo en el momento en que la usás.
- **Orden:** pendientes primero, y dentro de cada grupo por orden de incorporación. Sin reordenado
  manual en el MVP — arrastrar y soltar exige un modelo de posiciones que no vale la pena para una
  lista de la compra doméstica.
- Se registra **quién añadió** cada artículo y **quién lo marcó**, aunque la interfaz no lo muestre
  de forma destacada. El dato es gratis al escribir la fila y recuperarlo después no lo sería.

### RF-1.6 — Búsqueda dentro de una lista

- Un campo de búsqueda filtra los artículos de la lista abierta por su texto.
- **La búsqueda ignora mayúsculas y acentos:** escribir `azucar` encuentra `Azúcar`. En español esto
  no es un extra, es lo mínimo para que la búsqueda sirva. Es una **regla de dominio**, así que la
  normalización del texto vive en `domain/` y se testea sin renderizar nada.
- **La búsqueda se resuelve en cliente, nunca en el servidor.** Los artículos de la lista abierta ya
  están cargados en memoria, así que filtrar es instantáneo y no cuesta ni una petición. Mandar una
  consulta por cada tecla pulsada para filtrar treinta artículos sería absurdo.
- **Consecuencia técnica de obligado cumplimiento:** el texto de búsqueda **no forma parte de la
  query key**. Si entrase en la key, cada pulsación crearía una entrada de caché nueva y un viaje al
  servidor. La búsqueda es estado de vista, no criterio de obtención de datos.
- La búsqueda no altera el agrupado de RF-1.5: los pendientes siguen antes que los comprados.

### RF-1.7 — Sincronización

- Un artículo o una lista que uno crea, modifica o borra **aparece en el dispositivo del otro sin
  recargar**.
- Las acciones propias se ven de inmediato, sin esperar al servidor, y se revierten si el servidor
  las rechaza.
- Si se cae la conexión en tiempo real, al volver a la app los datos se refrescan igualmente.

### RF-1.8 — PWA

- Instalable en móvil y tablet desde el navegador ("añadir a pantalla de inicio").
- Manifest con nombre, iconos de 192 y 512 px, `display: standalone` y color de tema.
- La aplicación cacheada abre sin conexión, aunque **no se garantiza escribir sin conexión**.

## 3. Requisitos no funcionales

Se aplican las restricciones de producto del apartado 3 de `00-Vision-y-Modulos.md`. Específicos
de este módulo:

- **RNF-1.1 Seguridad.** Un usuario solo lee y escribe filas de su propio hogar, garantizado en el
  backend y no en el cliente. Es la regla central y se prueba explícitamente.
- **RNF-1.2 Zona horaria.** `Europe/Madrid` como referencia para cualquier corte de periodo. El
  módulo 1 apenas lo necesita, pero se fija aquí para que el módulo 2 no lo improvise.
- **RNF-1.3 Uso con una mano.** La lista se usa de pie en un supermercado: añadir y marcar tienen
  que estar al alcance del pulgar, con objetivos táctiles grandes.

## 4. Modelo de datos

El esquema completo, con la convención de auditoría, las restricciones y las políticas de seguridad,
está en **`05-Esquema-BD.md`**. Aquí solo lo que hay que saber al leer los requisitos:

- Cuatro tablas del hogar: `households`, `household_members`, `shopping_lists` y `shopping_items`,
  más `audit_log`.
- **El borrado es físico.** Se borra la fila. No hay filtros de vivo/muerto en ninguna consulta.
- **Toda tabla lleva auditoría en la propia fila** de creación y modificación, temporal y de usuario:
  `created_at`/`created_by` y `updated_at`/`updated_by`, estos últimos escritos por trigger y no por
  el cliente.
- **La auditoría de borrado vive en `audit_log`**, no en la fila: una fila borrada no puede guardar
  quién la borró. Un trigger registra cada INSERT, UPDATE y DELETE con su autor y el contenido
  completo de la fila, así que `old_data` de un DELETE es el respaldo de lo borrado.
- **Borrar una lista arrastra sus artículos** por `ON DELETE CASCADE`, y cada artículo queda
  registrado individualmente en la auditoría.
- **No hay campo de posición**, coherente con no ofrecer reordenado manual.

## 5. Criterios de aceptación del MVP

1. Entro con Google por primera vez, se crea mi hogar y ya tiene una lista "La compra".
2. Doy de alta a mi pareja en el hogar a mano, entra con su Google y ve el mismo hogar.
3. Creo una lista "Ferretería" y ella la ve aparecer sin recargar.
4. Renombro "Ferretería" a "Bricolaje" y el cambio le llega.
5. Añado "leche" a la compra desde el móvil y aparece en su pantalla sin que recargue.
6. Ella marca "leche" como comprada y lo veo marcado al instante.
7. Busco `azucar` y encuentra `Azúcar`.
8. Vacío los comprados y la lista queda solo con lo pendiente.
9. Borro una lista con artículos, se me avisa de cuántos se pierden, y al confirmar desaparecen
    lista y artículos **en todos los dispositivos**.
10. Entro con mi cuenta de Google desde un dispositivo nuevo y recupero mi hogar sin escribir
    ninguna contraseña, porque en ADuo no existe ninguna.
11. Instalo la app en la pantalla de inicio del móvil y abre como aplicación.
12. Un usuario de otro hogar no puede leer ni escribir nuestras listas ni nuestros artículos, ni su
    auditoría.
13. Tras esa serie de altas, ediciones y borrados, `audit_log` permite responder **quién** hizo cada
    cosa, **cuándo**, y **qué contenía** cada fila borrada.
14. Ningún usuario puede escribir, modificar ni borrar filas de `audit_log`, ni siquiera las propias.
