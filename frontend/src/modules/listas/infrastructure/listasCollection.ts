import { createCollection } from '@tanstack/react-db'
import type { Collection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import type { QueryClient } from '@tanstack/react-query'
import {
  actualizarLista,
  eliminarLista,
  insertarLista,
  obtenerListas,
} from './listasRepository'
import type { Lista } from '../domain/lista'

// Factory, not a module singleton (design D5): `queryCollectionOptions`
// requires a `QueryClient`, and the only instance lives in
// `app/providers/query.tsx`, which `infrastructure/` may not import
// (docs/03-Arquitectura.md §2, §3.2). `application/` supplies the client via
// `useQueryClient()`.
export function crearListasCollection(
  queryClient: QueryClient,
  householdId: string,
): Collection<Lista, string> {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: ['listas', householdId],
      queryFn: () => obtenerListas(householdId),
      getKey: (lista) => lista.id,
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
        await insertarLista(transaction.mutations[0].modified)
      },
      onUpdate: async ({ transaction }) => {
        await actualizarLista(transaction.mutations[0].modified)
      },
      onDelete: async ({ transaction }) => {
        await eliminarLista(transaction.mutations[0].key)
      },
    }),
  )
}
