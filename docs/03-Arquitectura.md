# Arquitectura de código

**Versión:** 1.0
**Fecha:** 17 de agosto de 2026
**Documento padre:** `00-Vision-y-Modulos.md`

---

## 1. Principio

**Modular por dominio, con corte hexagonal dentro de cada módulo.**

Al abrir `src/` se ve qué hace la aplicación —listas, gastos, bolsas—, no con qué está construida.
Los módulos del apartado 2 de la visión son carpetas reales, y añadir el módulo 2 es añadir una
carpeta sin tocar las otras.

### 1.1 Por qué no Feature-Sliced Design

FSD resuelve un problema real: coordinar muchas features y muchas personas con un grafo de
importaciones explícito. Su coste conocido es la ambigüedad de clasificación —decidir si algo es
`feature`, `entity` o `widget`— y ese coste se paga en cada archivo nuevo.

Con tres módulos y un solo desarrollador, ese coste no compra nada. Seis capas para tres dominios
es estructura sin problema que la justifique. Se descarta por proporcionalidad, no por criterio
técnico: en una aplicación con veinte features la conclusión sería la contraria.

## 2. Estructura de carpetas

```
src/
  app/                      arranque de la aplicación
    providers/              QueryClientProvider, sesión, tema
    router.tsx              árbol de rutas raíz
    main.tsx

  modules/
    listas/
      domain/               TypeScript puro: tipos y reglas
      application/          casos de uso, hooks que orquestan
      infrastructure/       adaptadores InsForge, cableado realtime
      ui/                   componentes y rutas del módulo
      index.ts              superficie pública del módulo

    gastos/                 (módulo 2, misma forma)
    bolsas/                 (módulo 3, misma forma)

  shared/
    ui/                     componentes generados por shadcn/ui
    lib/                    dinero, fechas, utilidades puras
    api/                    cliente InsForge, configuración
    hogar/                  hogar y sesión: transversal por naturaleza

  test/
    setup.ts
```

**Deuda de documentación (25 de agosto de 2026):** la tarea 036 introdujo `shared/hogar/ui/` para
la pantalla de acceso, un sublayer con forma de módulo (`domain`/`ui`) dentro de `shared/hogar/`
que este apartado todavía no describía explícitamente. Se acepta como precedente: `shared/hogar/`
puede tener su propio `ui/` cuando el estado que renderiza (la sesión) es transversal y no
pertenece a `modules/`.

**`shared/hogar/` no es un módulo.** Hogar, miembros y sesión los necesitan los tres módulos y no
son el dominio de ninguno. Vive en `shared` precisamente porque es el contexto compartido, y
convertirlo en un cuarto módulo crearía dependencias de todos hacia él, que es justo lo que las
fronteras de módulo intentan evitar.

### 2.1 Las rutas se quedan en `src/routes/`

**Decidido el 22 de agosto de 2026.** TanStack Router genera el árbol por ficheros desde
`src/routes/`, y ahí se quedan. Cada archivo de ruta es una cáscara fina que declara la URL e
importa el componente del módulo:

```tsx
// src/routes/listas.tsx
export const Route = createFileRoute('/listas')({ component: ListasPage })
```

La lógica, el estado y los componentes viven en `modules/<módulo>/ui/`. **Lo que rompería la
frontera del módulo es meter lógica de listas en `src/routes/`, no tener ahí un punto de entrada.**

Se valoró la alternativa: `virtualRouteConfig` en `tsr.config.json` con `@tanstack/virtual-file-routes`,
que permite montar `modules/listas/ui/routes` con el helper `physical()` y conservar el enrutado por
convención dentro. Técnicamente cuesta un archivo de configuración y funciona.

Se descarta **por ahora** por la misma razón que se descartó Feature-Sliced Design en el apartado
1.1: con un solo módulo, resuelve un problema que todavía no existe.

**Cuándo reconsiderarlo:** al empezar el módulo 2. Migrar entonces es mover archivos y declarar el
mount, no reescribir. El riesgo asumido es que migrar veinte rutas cuesta más que montarlo hoy con
una — se acepta a cambio de no cargar con la indirección durante todo el módulo 1.

## 3. Las cuatro capas de un módulo

| Capa | Qué contiene | Qué puede importar |
|---|---|---|
| `domain/` | Tipos y reglas de negocio. Funciones puras. | Nada del proyecto salvo `shared/lib`. |
| `application/` | Casos de uso. Hooks que orquestan dominio e infraestructura. | `domain/`, `infrastructure/`, `shared/`. |
| `infrastructure/` | Adaptadores: consultas a InsForge, suscripciones realtime, mapeo de filas a tipos de dominio. | `domain/`, `shared/api`. |
| `ui/` | Componentes y rutas. | `application/`, `domain/` (solo tipos), `shared/ui`. |

### 3.1 `domain/` es TypeScript puro

**Cero `import` de React. Cero `import` de InsForge.** Sin excepciones.

Es la regla que más valor entrega y la más fácil de romper por comodidad. Se testea sin un solo
mock, sin renderizar nada y sin entorno de navegador. Ahí van a vivir el reparto y el balance del
módulo 2: la lógica que si se equivoca, se equivoca el dinero.

Comprobación rápida de que la regla se respeta: si un archivo de `domain/` necesita un mock para
testearse, está mal colocado.

### 3.2 `infrastructure/` es la única capa que conoce InsForge

Todo lo que sepa de tablas, filas, PostgREST o suscripciones vive aquí y devuelve tipos de dominio.
Ninguna otra capa importa el cliente de InsForge.

De esta regla depende directamente que la decisión de tiempo real del apartado 2.5 de
`02-Decisiones-tecnicas-stack.md` sea reversible: cambiar TanStack Query por TanStack DB en el
módulo 2 es reescribir esta carpeta, y nada más.

### 3.3 `ui/` no calcula

Los componentes muestran y capturan. No hacen aritmética de negocio. Si un componente calcula un
balance, un reparto o un total, ese cálculo pertenece a `domain/` y el componente debería estar
llamándolo.

## 4. Reglas de importación

**4.1 La dirección de dependencia va hacia dentro.** `ui` → `application` → `domain`. Nunca al
revés. `domain` no importa de ninguna capa de su propio módulo.

**4.2 Los módulos no se tocan por dentro.** Está prohibido importar
`modules/gastos/infrastructure/...` desde otro módulo. Lo que un módulo ofrece lo ofrece por su
`index.ts`.

Esto no es una precaución abstracta: el módulo 3 va a necesitar hablar con el 2 por la referencia de
la bolsa que financia un gasto (apartado 7.2 de la visión). Esa puerta se define en la superficie
pública del módulo, no agarrando un archivo interno.

**4.3 `shared` no importa de `modules`.** Si algo en `shared` necesita conocer un módulo, no es
compartido: es de ese módulo.

**4.4 Los componentes de shadcn/ui viven en `shared/ui` y no se mezclan.** Son código copiado al
repositorio, no una dependencia: pasan a ser código propio que se mantiene. Mezclarlos con los
componentes de dominio hace que en seis meses no se distinga lo que generó la CLI de lo que se
escribió a mano — y eso importa cuando haya que actualizarlos.

## 5. Alias de rutas

Necesario para shadcn/ui y para que las importaciones no se llenen de `../../..`. Hay que
declararlo en **los dos sitios** o TypeScript y Vite discrepan:

- `vite.config.ts` → `resolve.alias`
- `tsconfig.json` → `compilerOptions.paths`

Alias: **`@/` → `src/`**. Es el que shadcn/ui espera por defecto, así que se adopta tal cual para no
pelearse con su CLI.

## 6. Tests

**Vitest** como runner: comparte configuración y transformaciones con Vite, así que no hay una
segunda cadena de build que mantener. **`@testing-library/react`** y **`@testing-library/user-event`**
para componentes, con **jsdom** como entorno.

Cobertura proporcional, no uniforme:

| Capa | Qué se testea |
|---|---|
| `domain/` | Exhaustivamente. Funciones puras, sin mocks. Es la lógica crítica. |
| `application/` | Los casos de uso relevantes, con la infraestructura sustituida. |
| `infrastructure/` | No se testea en unitario: es el borde. Se comprueba manualmente contra InsForge en el MVP. |
| `ui/` | Comportamiento observable de los flujos importantes, no detalles de render. |

**Flujo TDD para la lógica de negocio:** el test del dominio primero, en rojo; la función pura
después. Esto es viable precisamente porque `domain/` no necesita entorno ni mocks — y es la razón
práctica de la regla 3.1, más allá de la pureza conceptual.

La regla de seguridad —un usuario solo accede a filas de su hogar— **se prueba explícitamente**
contra el backend, no se asume. Es la única garantía de privacidad del producto.

## 7. Ejemplo concreto: módulo 1

```
modules/listas/
  domain/
    lista.ts                tipo Lista, reglas de nombre
    articulo.ts             tipo Articulo, marcar/desmarcar, orden
  application/
    useListas.ts            consultar, crear, renombrar, borrar listas
    useArticulos.ts         añadir, marcar, editar, borrar, vaciar comprados
  infrastructure/
    listasRepository.ts     consultas y mutaciones contra InsForge
    articulosRepository.ts
    realtime.ts             suscripción y volcado a la caché de Query
  ui/
    ListasPage.tsx
    ListaDetallePage.tsx
    ArticuloRow.tsx
    NuevoArticuloInput.tsx
  index.ts
```

Nótese que el orden de los artículos —pendientes primero, luego por incorporación— vive en
`domain/articulo.ts` y no en el componente ni en la consulta SQL. Es una regla de negocio del
producto (RF-1.5), se testea sin renderizar nada, y si mañana cambia, cambia en un sitio.

## 8. Lo que esta arquitectura deliberadamente no tiene

- **Sin capa de "servicios" genérica.** Un `services/` global es donde va a parar lo que nadie
  supo clasificar. Cada cosa pertenece a un módulo y a una capa.
- **Sin barrel files por capa.** Solo el `index.ts` de cada módulo, que sí tiene una función:
  definir la superficie pública. Los barrels internos añaden indirección y estropean el
  tree-shaking sin dar nada.
- **Sin abstracción sobre InsForge "por si cambiamos de backend".** `infrastructure/` ya es la
  costura suficiente. Una interfaz genérica de base de datos por adelantado es especulación, y la
  visión ya identificó el autoalojamiento de InsForge como la salida real ante dependencia de
  proveedor.
