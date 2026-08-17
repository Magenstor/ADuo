# Plan de trabajo — Módulo 1

**Versión:** 1.0
**Fecha:** 17 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`

---

## Cómo leer este documento

**Bloqueante** significa que hay trabajo posterior que no puede empezar hasta que esto esté hecho.
No significa "importante": significa que otras tareas están esperando.

| Marca | Significado |
|---|---|
| 🔴 | Bloqueante. Hay tareas esperando a esta. |
| 🟡 | No bloqueante, pero dentro del alcance del MVP. |
| ⚪ | No bloqueante y prescindible. Se puede recortar sin dañar el MVP. |
| ⚠️ | Riesgo: puede invalidar una decisión ya tomada. |

Los bloques van en orden. Dentro de cada bloque, el orden también importa salvo que se indique.

---

## Bloque 0 — Antes de escribir código

- [ ] **0.1** 🔴 `git init`, `.gitignore` de Node, y primer commit con los documentos de `docs/`.
      Ahora mismo hay varias horas de decisiones sin historial ni respaldo.
- [ ] **0.2** 🔴 **Definir el esquema SQL completo del módulo 1.** Las cuatro tablas del apartado 4
      de `01-Modulo-1-Lista-Compra.md` como DDL real: tipos, claves, `on delete cascade` de
      `shopping_items`, unicidad de `invite_code`, y la restricción que garantiza que el
      `household_id` de un artículo coincide con el de su lista.
- [ ] **0.3** 🔴 **Decidir cómo se impone el máximo de dos miembros por hogar.** No sale de un tipo
      de columna: es una regla de negocio y necesita mecanismo explícito en base de datos.
- [ ] **0.4** 🟡 Definir el formato del código de invitación: longitud, alfabeto y cómo se garantiza
      que no colisione.

## Bloque 1 — Validar InsForge antes de construir sobre él ⚠️

Este bloque va antes del andamiaje del proyecto **a propósito**. Todo lo que viene después asume que
InsForge hace tres cosas que nadie ha comprobado. Descubrir aquí que no las hace cuesta un día;
descubrirlo en el bloque 4 cuesta el módulo.

- [ ] **1.1** 🔴 Crear el proyecto en InsForge cloud (plan Free) y crear las tablas del 0.2.
- [ ] **1.2** 🔴 Configurar auth de email y contraseña, y **comprobar que la recuperación de
      contraseña por email funciona de verdad** (RF-1.1). Es un requisito del MVP y depende de que el
      proveedor envíe correo.
- [ ] **1.3** 🔴⚠️ Escribir las políticas de seguridad de fila y **probar explícitamente que un
      usuario de otro hogar no puede leer ni escribir nuestras filas**. Es la única garantía de
      privacidad del producto y el criterio de aceptación 13.
- [ ] **1.4** 🔴⚠️ **Spike de realtime + TanStack DB.** Suscribirse a `shopping_items` filtrando por
      `household_id`, capturar la forma exacta de los eventos, y volcarlos a una colección de
      TanStack DB con direct writes. Un script mínimo, sin arquitectura.
      **Si esto no encaja, cambia la decisión del apartado 2.5 del stack.** Ver `02-Decisiones-tecnicas-stack.md`, apartado 4.2.
- [ ] **1.5** 🟡 Comprobar si el plan Free permite un segundo proyecto como entorno de pruebas. Si no,
      decidir la convención de datos de prueba.

## Bloque 2 — Andamiaje del proyecto

- [ ] **2.1** 🔴 `pnpm` + Vite + React + TypeScript.
- [ ] **2.2** 🔴 **Alias `@/` → `src/` en `vite.config.ts` Y en `tsconfig.json`.** En los dos. Si
      falta en uno, TypeScript y Vite discrepan y la CLI de shadcn falla.
- [ ] **2.3** 🔴 Tailwind CSS, mobile-first.
- [ ] **2.4** 🔴 `shadcn/ui init`, con los componentes generados apuntando a `src/shared/ui`.
- [ ] **2.5** 🔴 Vitest + `@testing-library/react` + `user-event` + jsdom, y `src/test/setup.ts`.
      Va antes del primer dominio: sin runner no hay TDD.
- [ ] **2.6** 🔴 Crear el esqueleto de carpetas del apartado 2 de `03-Arquitectura.md`.
- [ ] **2.7** 🔴 Cliente de InsForge en `src/shared/api`.
- [ ] **2.8** 🔴 TanStack Router con el árbol de rutas raíz en `src/app`.
- [ ] **2.9** 🔴 TanStack Query + `QueryClientProvider`, y TanStack DB con `query-db-collection`.
- [ ] **2.10** ⚪ Lint y formateo. Ayuda, pero nada espera a esto.

## Bloque 3 — Hogar y sesión

Transversal: vive en `shared/hogar/`, no es un módulo. Bloquea todo el bloque 4, porque un artículo
sin hogar no existe.

- [ ] **3.1** 🔴 Registro, inicio de sesión y cierre de sesión.
- [ ] **3.2** 🔴 Persistencia de sesión y protección de rutas: la app no pide login en cada apertura.
- [ ] **3.3** 🔴 Recuperación de contraseña, flujo completo en la interfaz (RF-1.1).
- [ ] **3.4** 🔴 Crear hogar al registrarse el primero, con su código de invitación, y **crear la
      lista inicial "La compra"** (RF-1.3).
- [ ] **3.5** 🔴 Unirse a un hogar por código, con el rechazo cuando ya hay dos miembros (RF-1.2).
- [ ] **3.6** 🟡 Regenerar el código de invitación, invalidando el anterior.
- [ ] **3.7** 🟡 Editar el nombre visible del propio miembro.
- [ ] **3.8** 🟡 Estado de la interfaz cuando el segundo miembro todavía no se ha unido.

## Bloque 4 — Módulo de listas

Orden obligatorio dentro de cada tema: **dominio en rojo primero**, luego infraestructura, luego
aplicación, luego interfaz. Es la regla de `03-Arquitectura.md`.

### 4a. Dominio (TypeScript puro, sin React, sin InsForge)

- [ ] **4.1** 🔴 `domain/lista.ts`: tipo y reglas del nombre.
- [ ] **4.2** 🔴 `domain/articulo.ts`: tipo, marcar y desmarcar —incluido limpiar `bought_at` al
      desmarcar— y la regla de orden: pendientes primero, luego por incorporación (RF-1.5).
- [ ] **4.3** 🔴 `domain/busqueda.ts`: normalización que ignora mayúsculas y acentos, para que
      `azucar` encuentre `Azúcar` (RF-1.6).

### 4b. Infraestructura y aplicación

- [ ] **4.4** 🔴 Repositorios de listas y artículos contra InsForge, devolviendo tipos de dominio.
- [ ] **4.5** 🔴 Colecciones de TanStack DB y suscripción de realtime, según el patrón validado
      en 1.4.
- [ ] **4.6** 🔴 `useListas` y `useArticulos` en `application/`.

### 4c. Interfaz

- [ ] **4.7** 🔴 Listado de listas, y crear lista.
- [ ] **4.8** 🔴 Detalle de una lista: artículos, añadir, marcar y desmarcar.
- [ ] **4.9** 🟡 Editar y eliminar artículo.
- [ ] **4.10** 🟡 Renombrar lista.
- [ ] **4.11** 🟡 Borrar lista, con confirmación que dice **cuántos artículos se pierden** (RF-1.3).
- [ ] **4.12** 🟡 Vaciar los comprados de una lista.
- [ ] **4.13** 🟡 Buscador dentro de la lista (RF-1.6).
- [ ] **4.14** 🟡 Estado vacío cuando no hay ninguna lista (RF-1.3).
- [ ] **4.15** 🟡 Objetivos táctiles grandes y uso con una mano (RNF-1.3). No es estética: la app se
      usa de pie en un supermercado.

## Bloque 5 — PWA y despliegue

- [ ] **5.1** 🔴 `vite-plugin-pwa`: service worker y manifest con nombre, iconos de 192 y 512 px,
      `display: standalone` y color de tema.
- [ ] **5.2** 🟡 Iconos de la aplicación.
- [ ] **5.3** 🔴 Desplegar en el hosting de InsForge con URL en vivo.
- [ ] **5.4** 🔴 **Instalar en los dos móviles y usarla una semana haciendo la compra de verdad.**
      Es el único criterio de éxito que cuenta.

## Bloque 6 — Fuera del camino crítico

Nada espera a estas tareas. Se hacen cuando molesten lo suficiente.

- [ ] **6.1** ⚪ Decidir la visibilidad de errores del frontend. Único punto abierto del stack. Se
      revisa antes del módulo 2, donde un error silencioso puede ser un importe mal calculado.
- [ ] **6.2** ⚪ Despliegue automatizado. Manual es suficiente al principio.
- [ ] **6.3** ⚪ Modo oscuro. No se ha hablado de esto y no es alcance del MVP.

---

## Los cuatro riesgos reales

Todo lo demás es trabajo conocido. Estos cuatro pueden cambiar decisiones ya tomadas:

1. **1.4 — Realtime de InsForge con TanStack DB.** No hay adaptador oficial. Si no encaja, cambia el
   apartado 2.5 del stack.
2. **1.3 — Seguridad de fila.** Si no se puede expresar la regla del hogar, el modelo de privacidad
   del producto entero se replantea.
3. **1.2 — Correo de recuperación de contraseña.** Si el plan Free no envía correo de forma fiable,
   RF-1.1 no se cumple y hay que buscar otra vía.
4. **0.3 — Máximo dos miembros por hogar.** Si no hay forma limpia de imponerlo en base de datos,
   queda como regla de aplicación, que es más débil.

**Regla de oro del plan:** el bloque 1 va antes del bloque 2. Es tentador empezar montando el
proyecto porque es lo cómodo y lo que se sabe hacer. Pero montar el andamiaje sobre supuestos no
verificados es exactamente cómo se llega a tirar una semana de trabajo.
