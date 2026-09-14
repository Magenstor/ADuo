import { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { crearArticulosCollection } from './articulosCollection'
import type { Articulo } from '../domain/articulo'

// Mocks our own repository boundary, following the convention established in
// `use-sesion.test.ts` and `articulosRepository.test.ts`: the collection
// must delegate to `articulosRepository`, never call PostgREST directly, so
// the repository module is what gets mocked here.
const {
  obtenerArticulos,
  insertarArticulo,
  actualizarArticulo,
  eliminarArticulo,
} = vi.hoisted(() => ({
  obtenerArticulos: vi.fn(),
  insertarArticulo: vi.fn(),
  actualizarArticulo: vi.fn(),
  eliminarArticulo: vi.fn(),
}))
vi.mock('./articulosRepository', () => ({
  obtenerArticulos,
  insertarArticulo,
  actualizarArticulo,
  eliminarArticulo,
}))

function articuloCompleto(overrides: Partial<Articulo> = {}): Articulo {
  return {
    id: 'articulo-1',
    listaId: 'lista-1',
    householdId: 'hogar-1',
    contenido: 'Leche',
    comprado: false,
    boughtAt: null,
    boughtBy: null,
    createdAt: '2026-02-03T04:05:06.789Z',
    createdBy: 'usuario-creador',
    updatedAt: '2026-02-03T05:06:07.890Z',
    updatedBy: 'usuario-actualizador',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('crearArticulosCollection', () => {
  // Task 046 gave both collections `refetchOnWindowFocus`/
  // `refetchOnReconnect: 'always'`, which subscribes each collection's
  // internal `QueryClient` to the process-wide TanStack Query
  // `focusManager`/`onlineManager` singletons for as long as it stays
  // mounted. Cleaning up after every test keeps that subscription scoped to
  // its own test, so a later test's dispatched `visibilitychange`/`online`
  // event cannot also refetch a collection left over from an earlier test.
  let collection: ReturnType<typeof crearArticulosCollection> | undefined

  afterEach(async () => {
    await collection?.cleanup()
    collection = undefined
  })

  it('loads Articulos from queryFn and each record is retrievable by id via getKey', async () => {
    const original = articuloCompleto()
    obtenerArticulos.mockResolvedValue([original])
    const queryClient = new QueryClient()

    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()

    expect(obtenerArticulos).toHaveBeenCalledWith('hogar-1')
    expect(collection.get(original.id)).toMatchObject(original)
  })

  it('onInsert delegates to insertarArticulo and makes no other repository call', async () => {
    obtenerArticulos.mockResolvedValue([])
    insertarArticulo.mockResolvedValue(articuloCompleto({ id: 'articulo-2' }))
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()

    const nuevo = articuloCompleto({ id: 'articulo-2' })
    const tx = collection.insert(nuevo)
    await tx.isPersisted.promise

    expect(insertarArticulo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'articulo-2' }),
    )
    expect(actualizarArticulo).not.toHaveBeenCalled()
    expect(eliminarArticulo).not.toHaveBeenCalled()
  })

  it('onDelete delegates to eliminarArticulo with the id', async () => {
    const original = articuloCompleto()
    obtenerArticulos.mockResolvedValue([original])
    eliminarArticulo.mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()

    const tx = collection.delete(original.id)
    await tx.isPersisted.promise

    expect(eliminarArticulo).toHaveBeenCalledWith(original.id)
  })

  it('configures staleTime: Infinity so a direct write is not clobbered by a refetch', async () => {
    const original = articuloCompleto()
    obtenerArticulos.mockResolvedValue([original])
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ['articulos', 'hogar-1'] })
    // `staleTime` is an observer-level option not reflected on `Query`'s own
    // public type, though `queryCollectionOptions` does merge it in at
    // runtime — hence the narrow cast instead of a `@ts-expect-error`.
    const opciones = query?.options as { staleTime?: number } | undefined
    expect(opciones?.staleTime).toBe(Infinity)

    collection.utils.writeUpdate({
      id: original.id,
      contenido: 'Aplicado por realtime',
    })

    expect(collection.get(original.id)?.contenido).toBe('Aplicado por realtime')
    expect(obtenerArticulos).toHaveBeenCalledTimes(1)
  })

  it('a rejected onUpdate reverts contenido to the prior confirmed value', async () => {
    const original = articuloCompleto({ contenido: 'Leche' })
    obtenerArticulos.mockResolvedValue([original])
    actualizarArticulo.mockRejectedValue(new Error('server rejected'))
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()

    const tx = collection.update(original.id, (draft) => {
      draft.contenido = 'Pan'
    })
    await tx.isPersisted.promise.catch(() => {})

    expect(collection.get(original.id)?.contenido).toBe('Leche')
  })

  it('a rejected onDelete restores the removed Articulo with its prior data', async () => {
    const original = articuloCompleto()
    obtenerArticulos.mockResolvedValue([original])
    eliminarArticulo.mockRejectedValue(new Error('server rejected'))
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()

    const tx = collection.delete(original.id)
    await tx.isPersisted.promise.catch(() => {})

    expect(collection.has(original.id)).toBe(true)
    expect(collection.get(original.id)).toMatchObject(original)
  })
})

// Task 046 / design D6: `staleTime: Infinity` means a query is never
// considered "stale", so `refetchOnWindowFocus`/`refetchOnReconnect: true`
// (which only refetches an already-stale query) would be a silent no-op.
// These tests assert an actual `queryFn` (i.e. `obtenerArticulos`)
// invocation in response to a dispatched TanStack-recognized focus/reconnect
// event — never just the `'always'` config literal, which would hide that
// no-op. `document.visibilityState` in jsdom stays `'visible'` by default,
// so `focusManager` reads a focus regain from a dispatched
// `visibilitychange` event. Pattern reused from
// `app/providers/query.test.tsx`'s `waitFor` harness.
describe('crearArticulosCollection refetch on focus regain and reconnect', () => {
  let collection: ReturnType<typeof crearArticulosCollection> | undefined

  afterEach(async () => {
    await collection?.cleanup()
    collection = undefined
  })

  it('a window focus-regain event triggers a queryFn refetch despite staleTime: Infinity', async () => {
    const original = articuloCompleto()
    obtenerArticulos.mockResolvedValue([original])
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()
    expect(obtenerArticulos).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => {
      expect(obtenerArticulos).toHaveBeenCalledTimes(2)
    })
  })

  it('no focus-regain event means no extra queryFn invocation beyond the initial load', async () => {
    const original = articuloCompleto()
    obtenerArticulos.mockResolvedValue([original])
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()
    expect(obtenerArticulos).toHaveBeenCalledTimes(1)

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(obtenerArticulos).toHaveBeenCalledTimes(1)
  })

  it('a window online (reconnect) event triggers a queryFn refetch despite staleTime: Infinity', async () => {
    const original = articuloCompleto()
    obtenerArticulos.mockResolvedValue([original])
    const queryClient = new QueryClient()
    collection = crearArticulosCollection(queryClient, 'hogar-1')
    await collection.preload()
    expect(obtenerArticulos).toHaveBeenCalledTimes(1)

    // TanStack Query's onlineManager only notifies its listeners on a
    // state *change*; it starts "online", so a dropped-connection
    // regression is what actually exercises the reconnect path.
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(obtenerArticulos).toHaveBeenCalledTimes(2)
    })
  })

  it('reflects a change made on another device once the post-reconnect refetch resolves', async () => {
    const original = articuloCompleto()
    const cambiadoEnOtroDispositivo = articuloCompleto({
      contenido: 'Cambiado en otro dispositivo',
    })
    obtenerArticulos.mockResolvedValueOnce([original])
    const queryClient = new QueryClient()
    const coleccion = crearArticulosCollection(queryClient, 'hogar-1')
    collection = coleccion
    await coleccion.preload()
    expect(coleccion.get(original.id)?.contenido).toBe(original.contenido)

    // The realtime socket dropped, so this change never arrives as a
    // direct write; only the reconnect refetch can repair it.
    window.dispatchEvent(new Event('offline'))
    obtenerArticulos.mockResolvedValueOnce([cambiadoEnOtroDispositivo])
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(coleccion.get(original.id)?.contenido).toBe(
        cambiadoEnOtroDispositivo.contenido,
      )
    })
  })
})
