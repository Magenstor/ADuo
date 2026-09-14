import { createCollection } from '@tanstack/react-db'
import type { Collection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import type { QueryClient } from '@tanstack/react-query'
import {
  actualizarArticulo,
  eliminarArticulo,
  insertarArticulo,
  obtenerArticulos,
} from './articulosRepository'
import type { Articulo } from '../domain/articulo'

// Factory, not a module singleton (design D5): `queryCollectionOptions`
// requires a `QueryClient`, and the only instance lives in
// `app/providers/query.tsx`, which `infrastructure/` may not import
// (docs/03-Arquitectura.md §2, §3.2). `application/` supplies the client via
// `useQueryClient()`.
//
// One `articulos` collection per household, not per list — the realtime
// channel is per household (design D5). `application/` filters by `listaId`.
export function crearArticulosCollection(
  queryClient: QueryClient,
  householdId: string,
): Collection<Articulo, string> {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: ['articulos', householdId],
      queryFn: () => obtenerArticulos(householdId),
      getKey: (articulo) => articulo.id,
      // The socket is the update channel (listas-realtime); a low staleTime
      // would let a periodic refetch overwrite a direct write with stale
      // server state. See design D6.
      staleTime: Infinity,
      // 'always', never `true`: `true` only refetches a query already
      // considered stale, and `staleTime: Infinity` above means this query
      // is never stale — `true` would make this a silent no-op. A dropped
      // socket does not replay what it missed; this is the repair path
      // (task 046, design D6).
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      onInsert: async ({ transaction }) => {
        await insertarArticulo(transaction.mutations[0].modified)
      },
      onUpdate: async ({ transaction }) => {
        await actualizarArticulo(transaction.mutations[0].modified)
      },
      onDelete: async ({ transaction }) => {
        await eliminarArticulo(transaction.mutations[0].key)
      },
    }),
  )
}
