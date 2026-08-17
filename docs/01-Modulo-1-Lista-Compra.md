# Módulo 1 — Listas de la compra (MVP)

**Versión:** 2.0
**Fecha:** 17 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`

---

## 1. Alcance

Listas de la compra compartidas entre los miembros del hogar. Varias listas, con nombre.

El módulo 1 entrega además toda la base transversal del producto, porque es el primero que la
necesita: cuentas, hogar, invitación, sincronización en tiempo real, PWA instalable y despliegue.
Esa base es la mitad del trabajo real de este MVP.

**Explícitamente fuera:** notas libres, categorías de producto, precios, cantidades con unidades,
artículos recurrentes, plantillas de lista e historial de compras. Todo eso es mejora futura.

## 2. Requisitos funcionales

### RF-1.1 — Cuentas y acceso

- Registro e inicio de sesión con email y contraseña.
- **Recuperación de contraseña por email.** No es opcional: sin esto, olvidar la contraseña
  significa perder el acceso al hogar.
- Cierre de sesión.
- La sesión persiste entre aperturas de la app: no se pide login cada vez.

**Decisión — verificación de email: no se exige.** En una app privada de dos personas que se
conocen, el email no se usa para reputación ni para nada público; su única función real es la
recuperación de contraseña. Exigir verificación añade una pantalla, un estado intermedio de
"cuenta sin verificar" y un modo de fallo (correo que no llega) a cambio de nada.

### RF-1.2 — Hogar

- El primer usuario que se registra crea un hogar y obtiene un **código de invitación**.
- El segundo usuario se une introduciendo ese código.
- Cada miembro tiene un **nombre visible** dentro del hogar, editable por él mismo.
- **Máximo dos miembros por hogar** en el MVP. El código se rechaza si el hogar ya está completo.
- El código de invitación se puede **regenerar**, lo que invalida el anterior.
- Un usuario pertenece **a un solo hogar**.

**Decisión — abandonar el hogar: fuera del MVP.** Es la operación con más consecuencias de todo
el producto: al llegar el módulo 2 arrastra gastos, balances y deudas pendientes de alguien que ya
no está. Resolverlo bien no es trabajo del MVP, y resolverlo mal deja datos huérfanos. Se define
cuando exista el módulo 2.

### RF-1.3 — Listas

- Cualquiera de los dos puede **crear** una lista dándole un nombre. El nombre es obligatorio.
- Cualquiera puede **renombrar** cualquier lista del hogar.
- Cualquiera puede **borrar** cualquier lista del hogar. Borrar una lista **borra sus artículos**,
  así que la acción pide confirmación indicando cuántos artículos se van a perder.
- Todas las listas del hogar son visibles para los dos miembros. No hay listas privadas.
- Al crear el hogar se crea una **lista inicial llamada "La compra"**, para que la app no arranque
  vacía y se pueda usar sin configurar nada.
- Se puede borrar la última lista. En ese caso la app muestra un estado vacío que invita a crear
  una. No se inventa una regla especial de "mínimo una lista".

**Sin límite de listas** en el MVP. Dos personas no van a crear cuarenta, y poner un límite es
código y un mensaje de error a cambio de protegerse de un problema que no existe.

### RF-1.4 — Artículos

- **Añadir artículo** a una lista: un texto libre. Es el único campo obligatorio y el único campo.
- **Marcar como comprado** y desmarcar. Cualquiera de los dos puede marcar cualquier artículo, lo
  haya añadido él o el otro.
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

Solo lo que este módulo necesita. Los módulos 2 y 3 cuelgan después de `households`.

```
households
  id             uuid pk
  name           text
  invite_code    text único
  created_at     timestamptz

household_members
  household_id   fk → households
  user_id        fk → usuarios de auth
  display_name   text
  joined_at      timestamptz
  pk (household_id, user_id)
  -- regla de negocio del MVP: máximo 2 filas por household_id

shopping_lists
  id             uuid pk
  household_id   fk → households
  name           text
  created_by     fk → usuario
  created_at     timestamptz
  updated_at     timestamptz

shopping_items
  id             uuid pk
  list_id        fk → shopping_lists   (on delete cascade)
  household_id   fk → households       (desnormalizado, ver nota)
  content        text
  is_bought      boolean, por defecto false
  bought_by      fk → usuario, nullable
  bought_at      timestamptz, nullable
  created_by     fk → usuario
  created_at     timestamptz
  updated_at     timestamptz
```

**Notas de diseño**

- **`household_id` está desnormalizado en `shopping_items` a propósito.** El artículo ya pertenece
  a un hogar a través de su lista, así que el dato es redundante. Se duplica porque la regla de
  seguridad del producto es *"solo filas de mi hogar"*, y tenerla escrita igual en todas las tablas
  —sin un join para averiguar el hogar en cada comprobación— la hace uniforme, más barata y mucho
  más difícil de equivocar. Es una desnormalización deliberada al servicio de la seguridad, no un
  descuido. Requiere una restricción que garantice que el hogar del artículo coincide con el hogar
  de su lista.
- **Borrar una lista arrastra sus artículos** (`on delete cascade`), coherente con RF-1.3.
- **`is_bought` es la fuente única de verdad**, no se deriva de `bought_at`: un artículo puede
  desmarcarse, y entonces `bought_at` se limpia. Interpretar un `bought_at` viejo como estado
  actual sería un error silencioso.
- **No hay campo de posición**, coherente con no ofrecer reordenado manual.

## 5. Criterios de aceptación del MVP

1. Me registro, creo un hogar y obtengo un código. El hogar ya tiene una lista "La compra".
2. Mi pareja se registra, introduce el código y entra al mismo hogar.
3. Un tercero con ese código es rechazado porque el hogar ya está completo.
4. Regenero el código y el anterior deja de funcionar.
5. Creo una lista "Ferretería" y ella la ve aparecer sin recargar.
6. Renombro "Ferretería" a "Bricolaje" y el cambio le llega.
7. Añado "leche" a la compra desde el móvil y aparece en su pantalla sin que recargue.
8. Ella marca "leche" como comprada y lo veo marcado al instante.
9. Vacío los comprados y la lista queda solo con lo pendiente.
10. Borro una lista con artículos, se me avisa de cuántos se pierden, y al confirmar desaparecen
    lista y artículos en los dos dispositivos.
11. Olvido mi contraseña, pido recuperación por email y recupero el acceso.
12. Instalo la app en la pantalla de inicio del móvil y abre como aplicación.
13. Un usuario de otro hogar no puede leer ni escribir nuestras listas ni nuestros artículos.
