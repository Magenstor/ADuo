# Plan de trabajo — Módulo 1

**Versión:** 2.0
**Fecha:** 20 de agosto de 2026
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

- [x] **0.1** 🔴 `git init` y primer commit. **Hecho.** Queda el `.gitignore`, que lo genera
      `create-vite` en la tarea 2.1. ⚠️ Antes de poner ninguna clave en un `.env`, comprobar que está
      ignorado: la plantilla de Vite cubre `*.local` pero no necesariamente `.env` a secas.
- [x] **0.2** 🔴 **Esquema de base de datos definido.** Ver `05-Esquema-BD.md`: borrado físico,
      auditoría de creación y modificación en la fila, auditoría de borrado en `audit_log` por
      trigger.
- [x] **0.3** 🔴 **Sin límite de miembros por hogar** (decisión del 17 de agosto de 2026). No hay
      nada que imponer: se crea un grupo y se invita a quien se quiera. Riesgo eliminado.
- [x] **0.4** 🟡 **Sin código de invitación en el MVP** (decisión del 20 de agosto de 2026). Los
      miembros se dan de alta insertando la fila de `household_members` a mano en la consola de
      InsForge. Se retoma al terminar el MVP. Diferirlo es gratis: añadir la columna después es un
      `ALTER TABLE`, no una migración.

## Bloque 1 — Validar InsForge antes de construir sobre él

**Los cuatro riesgos que bloqueaban este bloque están resueltos** (20 de agosto de 2026). Lo que
queda no es incertidumbre, es trabajo: saber que algo *se puede hacer* no es tenerlo hecho.

Aun así, el bloque sigue yendo antes del andamiaje. Escribir y probar las políticas de seguridad de
fila sobre el proyecto real es más barato que descubrir en el bloque 4 que la regla no cubre un caso.

- [ ] **1.1** 🔴 Crear el proyecto en InsForge cloud (plan Free) y aplicar el DDL de `05-Esquema-BD.md`.
- [x] **1.1b** 🔴 **InsForge permite triggers y funciones `SECURITY DEFINER`.** Confirmado. La
      auditoría de `05-Esquema-BD.md` se puede implementar tal y como está diseñada.
- [ ] **1.2** 🔴 **Configurar OAuth de Google en InsForge** (RF-1.1). InsForge **no** ofrece
      recuperación de contraseña por correo, así que no hay login con contraseña propia: se delega en
      Google. Incluye dar de alta los **URI de redirección de desarrollo y de producción**, que son
      distintos y hacen falta los dos. Ver apartado 3.3 de `02-Decisiones-tecnicas-stack.md`.
- [ ] **1.3** 🔴 Escribir las políticas de seguridad de fila y **probar explícitamente que un
      usuario de otro hogar no puede leer ni escribir nuestras filas**. La regla del hogar **se puede
      expresar** en InsForge (confirmado), así que esto ya no es un riesgo, pero sigue siendo la única
      garantía de privacidad del producto y el criterio de aceptación 12. Incluye `audit_log`: solo
      lectura para los miembros, y escritura prohibida para todos (criterio 14).
- [ ] **1.4** 🔴 **Spike de realtime + TanStack DB.** InsForge expone el realtime **por WebSocket**
      (confirmado), y el reparto de capas está decidido en el apartado 4.1 del stack: Query hace la
      carga inicial, el WebSocket aplica los cambios con direct writes. Falta capturar la **forma
      exacta de los eventos** y volcarlos a una colección. Un script mínimo, sin arquitectura.
- [ ] **1.4b** 🔴⚠️ **Probar que el refetch no pisa los direct writes.** Aplicar un cambio por
      WebSocket, forzar un refetch y comprobar que el cambio sobrevive. Es comportamiento documentado
      de TanStack DB y se controla con `staleTime`. Ver apartado 4.2 del stack: el síntoma es un
      artículo borrado que reaparece solo.
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

- [ ] **3.1** 🔴 Entrar con Google y cerrar sesión. **Una sola pantalla:** con OAuth, registrarse e
      iniciar sesión son la misma acción (RF-1.1).
- [ ] **3.2** 🔴 Persistencia de sesión y protección de rutas: la app no pide login en cada apertura.
- [ ] **3.3** 🔴⚠️ **Probar el redirect de OAuth en la PWA ya instalada, en iOS y en Android.** Una
      app en `display: standalone` puede abrir el redirect en el navegador del sistema y dejar la
      sesión fuera de la aplicación. En el navegador de escritorio esto siempre funciona, así que
      probarlo ahí no demuestra nada. Es el riesgo número 1 del plan.
- [ ] **3.4** 🔴 Crear el hogar la primera vez que entra alguien, y **crear la lista inicial
      "La compra"** (RF-1.3).
- [ ] **3.5** 🔴 **Dar de alta al segundo miembro a mano** en `household_members` desde la consola de
      InsForge. No es una pantalla, es una fila. Pero **bloquea la validación de todo el tiempo
      real**: con un solo miembro los criterios 3 a 6 no se pueden probar.
- [ ] **3.6** ⚪ Flujo de invitación. **Fuera del MVP** (tarea 0.4). Se retoma cuando el resto
      funcione.
- [ ] **3.7** 🟡 Editar el nombre visible del propio miembro, prerrellenado con el que da Google.
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
      Sin filtros de borrado: el borrado es físico.
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

## Riesgos

### Cerrados el 20 de agosto de 2026

Los cuatro riesgos originales del plan están resueltos:

| Riesgo original | Resultado |
|---|---|
| Triggers y `SECURITY DEFINER` en InsForge | ✅ Permitidos. La auditoría se implementa como está diseñada. |
| Expresar la regla de seguridad de fila del hogar | ✅ Se puede. El modelo de privacidad se mantiene. |
| Realtime de InsForge con TanStack DB | ✅ InsForge da WebSocket. Reparto de capas en el apartado 4.1 del stack. |
| Correo de recuperación de contraseña | ❌ **No lo hay.** Resuelto eliminando el requisito: se delega el acceso en Google. |

El cuarto no se resolvió comprobando que funcionaba, sino **cambiando el producto para no
necesitarlo**. Es la forma más barata de cerrar un riesgo: quitar de en medio lo que dependía de él.

### Los dos riesgos vivos

1. **3.3 — El redirect de OAuth en la PWA instalada.** Es ahora el riesgo mayor del MVP, porque
   cruza los dos requisitos que definen el producto: entrar (RF-1.1) y ser una app instalada
   (RF-1.8). Una PWA en `display: standalone` puede mandar el redirect al navegador del sistema y
   dejar allí la sesión. **Solo se detecta probando en el móvil con la app instalada.** Si falla, no
   invalida el stack, pero obliga a resolver el flujo de acceso de otra manera.
2. **1.4b — Direct writes pisados por el refetch.** Comportamiento documentado de TanStack DB, no un
   fallo. Se controla con `staleTime`. No cambia ninguna decisión, pero si se pasa por alto produce
   el peor tipo de bug: intermitente y sin patrón visible.

**Regla de oro del plan:** el bloque 1 va antes del bloque 2. Es tentador empezar montando el
proyecto porque es lo cómodo y lo que se sabe hacer. Que los riesgos estén cerrados no cambia el
orden: las políticas de seguridad y el spike de realtime siguen siendo más baratos ahora que
después.
