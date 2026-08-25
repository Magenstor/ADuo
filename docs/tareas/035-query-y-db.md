# 035 — TanStack Query y TanStack DB

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Cliente y sesión |
| **Depende de** | [032](032-esqueleto-carpetas.md) |
| **Bloquea a** | 044 |

## Objetivo

Las dos piezas que sostienen los datos y el tiempo real.

## Pasos

- [x] Instalar `@tanstack/react-query`, `@tanstack/react-db` y `@tanstack/query-db-collection`.
- [x] Montar el `QueryClientProvider` en `src/app`.

## Hecho cuando

- El provider envuelve la aplicación y una query trivial funciona.

## Resultado

Hecha el 22 de agosto de 2026.

| Paquete | Versión resuelta |
|---|---|
| `@tanstack/react-query` | 5.101.4 |
| `@tanstack/query-db-collection` | 1.2.6 |
| `@tanstack/react-db` | **0.3.1** |

`@tanstack/react-db` sigue en 0.x, que es la pieza a vigilar del apartado 2.5 del stack. La versión
subió desde la 0.2.1 que anotaba aquel documento.

`src/app/providers/query.tsx` expone `AppProviders`, y `main.tsx` envuelve con él al
`RouterProvider`.

### El `QueryClient` se crea fuera del componente

A propósito. Creado dentro, cada render produciría un cliente nuevo y tiraría la caché entera en cada
uno: la aplicación parecería funcionar y refetchearía sin parar.

### `staleTime` se queda con los valores por defecto

**No es un olvido.** Es la decisión de la [044](044-colecciones.md), donde viven las colecciones. Un
`staleTime` mal puesto es el fallo descrito en el apartado 2.5 del stack: un refetch que aterriza
encima de un direct write de tiempo real y **hace reaparecer artículos ya borrados**. Elegirlo aquí,
sin colecciones a la vista, sería elegirlo a ciegas.

### Verificado

Dos tests en `src/app/providers/query.test.tsx`: una query trivial que resuelve, y otra cuyo
`queryFn` lanza y termina en error. El segundo está para que el primero signifique algo — sin él,
un provider roto podría dar verde igual.
