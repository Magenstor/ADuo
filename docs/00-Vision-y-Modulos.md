# ADuo — Visión de producto y mapa de módulos

**Versión:** 2.1
**Fecha:** 20 de agosto de 2026
**Estado:** vigente. Es el documento raíz del producto.

---

## 1. Objetivo del producto

ADuo es una aplicación de gestión doméstica para las personas que comparten una casa —típicamente
una pareja, pero sin límite de miembros. Cubre dos necesidades que hoy se resuelven con herramientas
separadas:

- **Qué hace falta en casa** — la lista de la compra.
- **El dinero de la casa** — qué se gasta, quién lo paga y de dónde sale ese dinero.

No es una app de gastos con listas añadidas, ni una app de listas con gastos añadidos. Son dos
dominios distintos que comparten un mismo contexto: el hogar.

## 2. Los tres módulos

| # | Módulo | Qué resuelve | Estado |
|---|---|---|---|
| 1 | **Listas de la compra** | Qué hay que comprar | **MVP — definido en `01-Modulo-1-Lista-Compra.md`** |
| 2 | **Gastos compartidos** | Qué se gastó, quién lo pagó y cómo se reparte | Documentado, sin definir |
| 3 | **Bolsas de dinero** | Cómo se distribuye el ingreso y qué bolsa financia cada gasto | Documentado, sin definir |

**Módulo no es fase.** El módulo es una frontera de dominio: es permanente y vive en la
estructura de carpetas. La fase es el orden de entrega. Los tres módulos se dibujan por dominio
desde el principio; lo que se decide por fase es qué porción de cada uno se construye y cuándo.
Un módulo puede aparecer parcialmente en una fase y completarse en otra posterior.

**Orden de entrega decidido:** módulo 1 → módulo 2 → módulo 3.

## 3. Restricciones de producto (aplican a los tres módulos)

- **Multiplataforma:** funciona en navegador y en móvil/tablet (Android e iOS) mediante una PWA
  instalable. Un único desarrollo.
- **Sincronización:** los datos viven en un backend. Ningún dato exclusivamente local.
- **Privacidad:** los datos solo son visibles para los miembros del hogar. Comunicación por HTTPS.
  ADuo **no almacena contraseñas**: el acceso se delega en un proveedor de identidad externo.
- **Moneda:** euros con dos decimales, almacenados en céntimos enteros. Sin multi-moneda.
- **Idioma:** español. Sin i18n.
- **Offline:** deseable, no bloqueante. El service worker cachea la aplicación, pero no se
  garantiza escribir sin conexión.

## 4. Módulo 1 — Listas de la compra (MVP)

**Alcance:** listas de la compra compartidas, con nombre, editables y borrables. Sin notas libres.

**Por qué es el MVP.** Es el módulo con el dominio más simple, y precisamente por eso es el mejor
primero. Obliga a resolver de una vez todo lo transversal —autenticación, creación del hogar,
sincronización en tiempo real, PWA instalable y despliegue— con la lógica
de negocio más liviana posible. Al terminarlo hay infraestructura probada en uso real, y el
módulo 2, que sí tiene lógica delicada, se construye encima de cimientos que ya funcionan.

**Mejora futura ya identificada:** notas libres. Fuera del MVP por decisión explícita.

Definición funcional completa en **`01-Modulo-1-Lista-Compra.md`**.

## 5. Módulo 2 — Gastos compartidos (documentado, sin definir)

Estilo Tricount, simplificado para uso doméstico. Este apartado recoge la intención y el trabajo
funcional ya realizado; **no es una especificación cerrada**.

### 5.1 Intención

- **Registro de gastos.** Cualquiera de los dos crea un gasto con importe, categoría, fecha,
  quién lo pagó y descripción opcional. Cualquiera puede editar y eliminar cualquier gasto, sea
  suyo o del otro.
- **Categorías.** Comida, Luz, Agua, Gas, Internet, Alquiler/Hipoteca, Hogar, Ocio, Otros. Son
  parte de este módulo, no un módulo aparte: sin gastos que clasificar no tienen sentido propio.
  Se crean como filas propias del hogar, para que cada pareja pueda renombrarlas.
- **Reparto configurable por gasto.** 50/50 por defecto para agilizar el registro, con
  porcentajes libres (70/30, 60/40) y accesos rápidos a los casos habituales: 50/50, 100% uno,
  100% el otro. Caso real: la hipoteca la asume al 100% uno de los dos y no genera deuda,
  mientras que la luz se reparte al 50/50.
- **Reparto por defecto por categoría** (deseable): al elegir la categoría, el reparto se rellena
  solo.
- **Balance.** Visible en todo momento: quién ha pagado más y cuánto le debe el otro. No se
  almacena, se calcula al vuelo.
- **Saldar cuentas.** Registrar un pago entre los dos que pone el balance a cero o lo reduce. El
  pago queda como un movimiento visible en el historial.
- **Resumen mensual.** Total gastado y desglose por categoría, con gráfico sencillo y navegación
  entre meses.
- **Historial con filtros.** Listado por fecha, con filtros por mes, categoría y quién pagó.
- **Presupuestos por categoría.** Presupuesto mensual por categoría, con progreso y aviso visual
  al superarlo. Es la funcionalidad más prescindible del módulo: primera candidata a recortar.

### 5.2 Fuera del alcance de este módulo

Reparto proporcional automático a los ingresos; escaneo de tickets y adjuntar fotos; conexión con
bancos; gastos recurrentes automáticos (candidato claro para la iteración siguiente); notificaciones
push; exportar a CSV o Excel.

Ya **no** está fuera de alcance el grupo de más de dos personas: desde el 17 de agosto de 2026 no hay
límite de miembros.

### 5.3 Sin definir todavía

El modelo de reparto en base de datos, el tratamiento de borrados y ediciones, y el alcance
exacto de resumen, historial y presupuestos. Ver preguntas abiertas en el apartado 8.

## 6. Módulo 3 — Bolsas de dinero (documentado, sin definir)

**Intención.** Cada usuario reparte lo que ingresa en bolsas con nombre: del sueldo de este mes,
tanto a una bolsa, tanto a otra. Es presupuesto por sobres, no un simple objetivo de ahorro.

**La integración que da sentido al módulo.** Una vez existan las bolsas, cada gasto debe poder
indicar de qué bolsa sale su dinero. Esto es lo que convierte tres módulos sueltos en una sola
aplicación, y es la razón del apartado 7.

**Sin definir todavía:** si las bolsas son por usuario o por hogar, qué ocurre al agotar una
bolsa, si el reparto del ingreso es manual o por reglas, y cómo se traspasa un saldo entre meses.

## 7. Decisiones estructurales que el módulo 1 debe respetar

El módulo 1 no maneja dinero, pero sí levanta los cimientos sobre los que se apoyan los otros
dos. Estas decisiones se toman ahora porque cambiarlas después obliga a migrar datos reales ya
registrados.

**7.1 Un gasto alimentará dos libros independientes.** El mismo hecho —"100 € de comida, los pagó
A, al 50/50, salen de la bolsa Comida"— produce dos verdades simultáneas que no se derivan una de
la otra:

- *Balance entre personas:* B le debe 50 a A.
- *Consumo de bolsa:* la bolsa Comida bajó 100.

Son ortogonales y se modelan por separado. Colapsarlas en un solo cálculo es el error que
obligaría a reescribir el módulo 2 entero.

**7.2 La atribución a bolsa nace en el módulo 2, como referencia opcional.** El gasto lleva desde
el primer día una referencia nullable a la bolsa que lo financia. No se construye nada del módulo
3 por adelantado: solo se deja la costura. Si no se deja, cuando llegue el módulo 3 habrá que
migrar meses de gastos reales y rehacer el cálculo de balance.

**7.3 El reparto se guarda por usuario, nunca como porcentaje de "persona A".** Ya no es una
recomendación: desde que no hay límite de miembros (17 de agosto de 2026), un campo `split_a` es
**imposible**. Un porcentaje único que describe "la parte de la persona A" no puede repartir entre
tres personas, y no hay forma de parchearlo. El reparto vive obligatoriamente en una tabla de partes
por usuario. Ver el apartado 5 de `05-Esquema-BD.md`.

**7.4 El hogar es la raíz de todo.** Hogar más miembros es el modelo base que el módulo 1 ya
necesita para compartir la lista, y del que cuelgan después gastos, categorías y bolsas. La regla
de seguridad es única y central: un usuario solo accede a filas cuyo hogar es suyo.

**7.5 El dinero siempre en céntimos enteros.** Nunca en coma flotante. Se formatea a euros solo en
la capa de presentación.

## 8. Preguntas abiertas

Ninguna resuelta. Se cierran al definir el módulo al que pertenecen.

**Transversales — hay que resolverlas en el MVP,** porque el módulo 1 es el que trae la
autenticación y el hogar. Se tratan en `01-Modulo-1-Lista-Compra.md`.

- ~~Recuperación de contraseña y verificación de email.~~ **Resuelto el 20 de agosto de 2026:** el
  acceso se delega en Google, así que ADuo no tiene contraseñas que recuperar ni emails que
  verificar. Ver RF-1.1.
- Onboarding: **cómo se invita a un miembro**, diferido al terminar el MVP (20 de agosto de 2026);
  si un usuario puede pertenecer a dos hogares, y si se puede salir de un hogar.
- Zona horaria de referencia para los cortes de periodo.

**Del módulo 2:**

- Borrado físico o lógico de un gasto, y qué ocurre con los gastos de una categoría eliminada.
- Rastro de auditoría: ambos miembros pueden editar y borrar cualquier gasto, y no hay registro
  de quién lo hizo.
- Presupuestos por categoría: como valor único no tienen historia por mes, así que editarlos
  reescribiría el pasado.
- Incoherencia de nomenclatura heredada: "Alquiler/Hipoteca" frente a "Hipoteca".

## 9. Criterios de éxito del producto

- Los dos podéis usar la app desde el móvil y desde el ordenador con el mismo hogar.
- Las listas de la compra están siempre al día y sincronizadas entre los dos (módulo 1).
- En cualquier momento sabéis quién debe cuánto a quién sin hacer cuentas a mano (módulo 2).
- A final de mes veis cuánto habéis gastado en total y por categoría (módulo 2).
- Cada gasto sabe de qué bolsa salió (módulo 3).

## 10. Mapa de documentos

| Documento | Contenido |
|---|---|
| `00-Vision-y-Modulos.md` | Este documento. Visión, módulos, orden y decisiones estructurales. |
| `01-Modulo-1-Lista-Compra.md` | Definición funcional del MVP. |
| `02-Decisiones-tecnicas-stack.md` | Stack, librerías y decisiones técnicas transversales. |
| `03-Arquitectura.md` | Estructura de carpetas, capas, reglas de importación y tests. |
| `tareas/000-indice.md` | Índice de las 62 tareas del módulo 1, en orden de ejecución. |
| `05-Esquema-BD.md` | Esquema SQL, convención de auditoría y seguridad de fila. |
