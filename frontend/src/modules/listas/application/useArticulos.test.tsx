import { act, renderHook } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { crearListasCollection } from '../infrastructure/listasCollection'
import { crearArticulosCollection } from '../infrastructure/articulosCollection'
import { useArticulos } from './useArticulos'
import type { Articulo } from '../domain/articulo'
import type { Lista } from '../domain/lista'
import type { Resultado } from './useListas'

// Only the household/session/resource-boundary seams are faked. Both
// collections come from the real factories, so the projections, optimistic
// mutations and rollbacks asserted below are produced by the real TanStack DB
// transaction pipeline instead of by a stub.
const { useHogar, useSesion, useRecursosListas } = vi.hoisted(() => ({
  useHogar: vi.fn(),
  useSesion: vi.fn(),
  useRecursosListas: vi.fn(),
}))
vi.mock('@/shared/hogar/hogar-contexto', () => ({ useHogar }))
vi.mock('@/shared/hogar/sesion-contexto', () => ({ useSesion }))
vi.mock('./hogar-listas', () => ({ useRecursosListas }))

// The two PostgREST repositories are the single mocked boundary: the
// `obtener*` functions are the collections' `queryFn` (the server read the
// collection replays after every mutation handler) and the write functions
// are their persistence handlers.
const { obtenerListas, insertarLista, actualizarLista, eliminarLista } =
  vi.hoisted(() => ({
    obtenerListas: vi.fn(),
    insertarLista: vi.fn(),
    actualizarLista: vi.fn(),
    eliminarLista: vi.fn(),
  }))
vi.mock('../infrastructure/listasRepository', () => ({
  obtenerListas,
  insertarLista,
  actualizarLista,
  eliminarLista,
}))

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
vi.mock('../infrastructure/articulosRepository', () => ({
  obtenerArticulos,
  insertarArticulo,
  actualizarArticulo,
  eliminarArticulo,
}))

const articulo = (id: string, overrides: Partial<Articulo> = {}): Articulo => ({
  id,
  listaId: 'lista-1',
  householdId: 'hogar-1',
  contenido: id,
  comprado: false,
  boughtAt: null,
  boughtBy: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'u-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'u-1',
  ...overrides,
})

const listaFija = (id: string, overrides: Partial<Lista> = {}): Lista => ({
  id,
  householdId: 'hogar-1',
  nombre: id,
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'u-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'u-1',
  ...overrides,
})

function diferido<T>() {
  let resolver!: (valor: T) => void
  let rechazar!: (causa: unknown) => void
  const promesa = new Promise<T>((cumplir, fallar) => {
    resolver = cumplir
    rechazar = fallar
  })
  // The rejection is always consumed by the hook's awaited transaction; this
  // keeps Node from reporting it before the hook attaches its handler.
  promesa.catch(() => undefined)
  return { promesa, resolver, rechazar }
}

// A minimal in-memory stand-in for the two PostgREST tables. The collection
// replays its `queryFn` after every mutation handler, so a successful delete
// has to disappear from the server read as well — otherwise the refetch would
// resurrect it and no rollback assertion below would mean anything.
const tablaListas = new Map<string, Lista>()
const tablaArticulos = new Map<string, Articulo>()

function conectarRepositorios() {
  obtenerListas.mockImplementation(async () => Array.from(tablaListas.values()))
  insertarLista.mockImplementation(async (fila: Lista) => {
    tablaListas.set(fila.id, fila)
    return fila
  })
  actualizarLista.mockImplementation(async (fila: Lista) => {
    tablaListas.set(fila.id, fila)
    return fila
  })
  eliminarLista.mockImplementation(async (id: string) => {
    tablaListas.delete(id)
  })
  obtenerArticulos.mockImplementation(async () =>
    Array.from(tablaArticulos.values()),
  )
  insertarArticulo.mockImplementation(async (fila: Articulo) => {
    tablaArticulos.set(fila.id, fila)
    return fila
  })
  actualizarArticulo.mockImplementation(async (fila: Articulo) => {
    tablaArticulos.set(fila.id, fila)
    return fila
  })
  eliminarArticulo.mockImplementation(async (id: string) => {
    tablaArticulos.delete(id)
  })
}

async function montarRecursos({
  householdId = 'hogar-1',
  listas: filasListas = [listaFija('lista-1')],
  articulos: filasArticulos = [],
}: {
  householdId?: string
  listas?: Array<Lista>
  articulos?: Array<Articulo>
} = {}) {
  tablaListas.clear()
  tablaArticulos.clear()
  filasListas.forEach((fila) => tablaListas.set(fila.id, fila))
  filasArticulos.forEach((fila) => tablaArticulos.set(fila.id, fila))
  const queryClient = new QueryClient()
  const listas = crearListasCollection(queryClient, householdId)
  const articulos = crearArticulosCollection(queryClient, householdId)
  await Promise.all([listas.preload(), articulos.preload()])
  return { householdId, listas, articulos }
}

describe('useArticulos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useHogar.mockReturnValue({
      estado: 'ready',
      hogar: { id: 'hogar-1', nombre: 'Casa' },
      miembros: [],
    })
    useSesion.mockReturnValue({ user: { id: 'u-1' } })
    conectarRepositorios()
  })

  it('filters by active list and household and orders pending records before bought records', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        listas: [listaFija('lista-1'), listaFija('lista-2')],
        articulos: [
          articulo('comprado', {
            comprado: true,
            createdAt: '2026-01-02T00:00:00.000Z',
          }),
          articulo('pendiente'),
          articulo('otra-lista', { listaId: 'lista-2' }),
          articulo('otro-hogar', { householdId: 'hogar-2' }),
        ],
      }),
    )
    const { result } = renderHook(() => useArticulos('lista-1'))
    expect(result.current.articulos.map(({ id }) => id)).toEqual([
      'pendiente',
      'comprado',
    ])
    expect(result.current.ready).toBe(true)
  })

  it('rejects invalid, cross-list, and unavailable actions before a write', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        listas: [listaFija('lista-1'), listaFija('lista-2')],
        articulos: [
          articulo('a'),
          articulo('otra-lista', { listaId: 'lista-2' }),
        ],
      }),
    )
    const { result } = renderHook(() => useArticulos('lista-1'))
    await expect(result.current.agregar('  ')).resolves.toMatchObject({
      ok: false,
      error: { tipo: 'validation' },
    })
    await expect(
      result.current.editar('otra-lista', 'Pan'),
    ).resolves.toMatchObject({ ok: false })
    await expect(result.current.marcar('ausente')).resolves.toMatchObject({
      ok: false,
    })
    expect(insertarArticulo).not.toHaveBeenCalled()
    expect(actualizarArticulo).not.toHaveBeenCalled()
  })

  it('awaits add, edit, mark, unmark, and delete persistence failures without reporting success', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [articulo('a'), articulo('b', { comprado: true })],
      }),
    )
    actualizarArticulo.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useArticulos('lista-1'))

    await act(async () => {
      await expect(result.current.agregar(' Leche ')).resolves.toMatchObject({
        ok: true,
      })
      await expect(result.current.editar('a', 'Pan')).resolves.toMatchObject({
        ok: false,
        error: { tipo: 'persistence' },
      })
      await expect(result.current.marcar('a')).resolves.toMatchObject({
        ok: false,
      })
      await expect(result.current.desmarcar('b')).resolves.toMatchObject({
        ok: false,
      })
      await expect(result.current.eliminar('a')).resolves.toMatchObject({
        ok: true,
      })
    })

    expect(insertarArticulo).toHaveBeenCalledWith(
      expect.objectContaining({ contenido: 'Leche' }),
    )
  })

  it('keeps a successful clear-bought deletion removed while returning failed IDs in selected order', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [
          articulo('x', { comprado: true }),
          articulo('y', {
            comprado: true,
            createdAt: '2026-01-02T00:00:00.000Z',
          }),
          articulo('z'),
        ],
      }),
    )
    eliminarArticulo.mockImplementation(async (id: string) => {
      if (id === 'y') throw new Error('denied')
      tablaArticulos.delete(id)
    })
    const { result } = renderHook(() => useArticulos('lista-1'))

    await act(async () => {
      await expect(result.current.limpiarComprados()).resolves.toMatchObject({
        ok: true,
        valor: { successfulIds: ['x'], failedIds: ['y'] },
      })
    })

    expect(eliminarArticulo).toHaveBeenNthCalledWith(1, 'x')
    expect(eliminarArticulo).toHaveBeenNthCalledWith(2, 'y')
  })

  it('keeps an optimistic article visible while its add is pending and converges on the server echo', async () => {
    useRecursosListas.mockReturnValue(await montarRecursos())
    const persistencia = diferido<Articulo>()
    insertarArticulo.mockReturnValue(persistencia.promesa)
    const { result } = renderHook(() => useArticulos('lista-1'))

    let pendiente!: Promise<Resultado<string>>
    await act(async () => {
      pendiente = result.current.agregar(' Leche ')
    })

    expect(result.current.articulos).toEqual([
      expect.objectContaining({
        contenido: 'Leche',
        listaId: 'lista-1',
        comprado: false,
        createdBy: 'u-1',
      }),
    ])
    const provisional = result.current.articulos[0]

    tablaArticulos.set(provisional.id, {
      ...provisional,
      updatedAt: '2026-03-01T00:00:00.000Z',
      updatedBy: 'otro-dispositivo',
    })
    await act(async () => {
      persistencia.resolver(provisional)
      await expect(pendiente).resolves.toMatchObject({
        ok: true,
        valor: provisional.id,
      })
    })

    expect(result.current.articulos).toEqual([
      expect.objectContaining({
        id: provisional.id,
        contenido: 'Leche',
        updatedAt: '2026-03-01T00:00:00.000Z',
        updatedBy: 'otro-dispositivo',
      }),
    ])
  })

  it('restores the previous article content when the edit persistence fails', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [articulo('a', { contenido: 'Leche' })],
      }),
    )
    actualizarArticulo.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useArticulos('lista-1'))
    expect(result.current.articulos.map(({ contenido }) => contenido)).toEqual([
      'Leche',
    ])

    await act(async () => {
      await expect(result.current.editar('a', 'Pan')).resolves.toMatchObject({
        ok: false,
        error: { tipo: 'persistence' },
      })
    })

    expect(result.current.articulos.map(({ contenido }) => contenido)).toEqual([
      'Leche',
    ])
    expect(result.current.error).toMatchObject({ tipo: 'persistence' })
  })

  it('restores the previous bought state when marcar and desmarcar persistence fails', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [
          articulo('a'),
          articulo('b', {
            comprado: true,
            boughtAt: '2026-01-05T00:00:00.000Z',
            boughtBy: 'u-9',
          }),
        ],
      }),
    )
    actualizarArticulo.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useArticulos('lista-1'))

    await act(async () => {
      await expect(result.current.marcar('a')).resolves.toMatchObject({
        ok: false,
      })
      await expect(result.current.desmarcar('b')).resolves.toMatchObject({
        ok: false,
      })
    })

    expect(result.current.articulos).toEqual([
      expect.objectContaining({ id: 'a', comprado: false, boughtBy: null }),
      expect.objectContaining({
        id: 'b',
        comprado: true,
        boughtBy: 'u-9',
        boughtAt: '2026-01-05T00:00:00.000Z',
      }),
    ])
  })

  it('hides a deleted article while its persistence is pending and restores it on failure', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [
          articulo('a'),
          articulo('b', { createdAt: '2026-01-02T00:00:00.000Z' }),
        ],
      }),
    )
    const persistencia = diferido<void>()
    eliminarArticulo.mockReturnValue(persistencia.promesa)
    const { result } = renderHook(() => useArticulos('lista-1'))

    let pendiente!: Promise<Resultado<void>>
    await act(async () => {
      pendiente = result.current.eliminar('a')
    })
    expect(result.current.articulos.map(({ id }) => id)).toEqual(['b'])

    await act(async () => {
      persistencia.rechazar(new Error('denied'))
      await expect(pendiente).resolves.toMatchObject({ ok: false })
    })

    expect(result.current.articulos.map(({ id }) => id)).toEqual(['a', 'b'])
  })

  it('removes the cleared articles, restores the failed one and leaves unbought records visible', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [
          articulo('x', { comprado: true }),
          articulo('y', {
            comprado: true,
            createdAt: '2026-01-02T00:00:00.000Z',
          }),
          articulo('z'),
        ],
      }),
    )
    eliminarArticulo.mockImplementation(async (id: string) => {
      if (id === 'y') throw new Error('denied')
      tablaArticulos.delete(id)
    })
    const { result } = renderHook(() => useArticulos('lista-1'))

    await act(async () => {
      await expect(result.current.limpiarComprados()).resolves.toMatchObject({
        ok: true,
        valor: { successfulIds: ['x'], failedIds: ['y'] },
      })
    })

    expect(result.current.articulos.map(({ id }) => id)).toEqual(['z', 'y'])
    expect(result.current.error).toMatchObject({ tipo: 'persistence' })
  })

  it('never deletes a foreign-household bought article that shares the requested list ID', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [
          articulo('propio', { comprado: true }),
          articulo('ajeno', { comprado: true, householdId: 'hogar-2' }),
        ],
      }),
    )
    const { result } = renderHook(() => useArticulos('lista-1'))
    expect(result.current.articulos.map(({ id }) => id)).toEqual(['propio'])

    await act(async () => {
      await expect(result.current.limpiarComprados()).resolves.toMatchObject({
        ok: true,
        valor: { successfulIds: ['propio'], failedIds: [] },
      })
    })

    expect(eliminarArticulo).toHaveBeenCalledTimes(1)
    expect(eliminarArticulo).toHaveBeenCalledWith('propio')
    expect(tablaArticulos.has('ajeno')).toBe(true)
  })

  it('makes no delete request and returns empty outcome collections when the list has nothing bought', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [articulo('z'), articulo('w')],
      }),
    )
    const { result } = renderHook(() => useArticulos('lista-1'))

    await act(async () => {
      await expect(result.current.limpiarComprados()).resolves.toMatchObject({
        ok: true,
        valor: { successfulIds: [], failedIds: [] },
      })
    })

    expect(eliminarArticulo).not.toHaveBeenCalled()
    expect(result.current.articulos.map(({ id }) => id)).toEqual(['w', 'z'])
  })

  // The collection itself yields tied records in codepoint order ('B' before
  // 'a'), so these mixed-case IDs are what makes the hook's own
  // `localeCompare` tiebreaker observable: without it the projection would
  // simply echo the storage order.
  it('breaks createdAt ties by ID and keeps that order after a rollback', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        articulos: [articulo('c'), articulo('a'), articulo('B')],
      }),
    )
    const persistencia = diferido<void>()
    eliminarArticulo.mockReturnValue(persistencia.promesa)
    const { result } = renderHook(() => useArticulos('lista-1'))
    expect(result.current.articulos.map(({ id }) => id)).toEqual([
      'a',
      'B',
      'c',
    ])

    let pendiente!: Promise<Resultado<void>>
    await act(async () => {
      pendiente = result.current.eliminar('B')
    })
    expect(result.current.articulos.map(({ id }) => id)).toEqual(['a', 'c'])

    await act(async () => {
      persistencia.rechazar(new Error('denied'))
      await expect(pendiente).resolves.toMatchObject({ ok: false })
    })

    expect(result.current.articulos.map(({ id }) => id)).toEqual([
      'a',
      'B',
      'c',
    ])
  })

  it('keeps deterministic order when a realtime insert lands while a rollback is still pending', async () => {
    const recursos = await montarRecursos({
      articulos: [
        articulo('a'),
        articulo('b', { createdAt: '2026-01-02T00:00:00.000Z' }),
      ],
    })
    useRecursosListas.mockReturnValue(recursos)
    const persistencia = diferido<void>()
    eliminarArticulo.mockReturnValue(persistencia.promesa)
    const { result } = renderHook(() => useArticulos('lista-1'))

    let pendiente!: Promise<Resultado<void>>
    await act(async () => {
      pendiente = result.current.eliminar('b')
    })
    expect(result.current.articulos.map(({ id }) => id)).toEqual(['a'])

    // What the realtime translator does for an `item.insert` from another
    // device: a server-authoritative write straight into the synced store.
    await act(async () => {
      recursos.articulos.utils.writeUpsert(
        articulo('c', { createdAt: '2026-01-03T00:00:00.000Z' }),
      )
    })
    expect(result.current.articulos.map(({ id }) => id)).toEqual(['a', 'c'])

    await act(async () => {
      persistencia.rechazar(new Error('denied'))
      await expect(pendiente).resolves.toMatchObject({ ok: false })
    })

    expect(result.current.articulos.map(({ id }) => id)).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('hides the child subtree while the parent list deletion is pending and issues no child delete', async () => {
    const recursos = await montarRecursos({
      articulos: [
        articulo('a'),
        articulo('b', { createdAt: '2026-01-02T00:00:00.000Z' }),
      ],
    })
    useRecursosListas.mockReturnValue(recursos)
    const persistencia = diferido<void>()
    eliminarLista.mockReturnValue(persistencia.promesa)
    // This consumer is mounted on its own: nothing but the parent list's own
    // live state may drive it back to a non-ready projection.
    const { result } = renderHook(() => useArticulos('lista-1'))
    expect(result.current.articulos.map(({ id }) => id)).toEqual(['a', 'b'])

    const borrado = recursos.listas.delete('lista-1')
    await act(async () => undefined)

    expect(result.current.articulos).toEqual([])
    expect(result.current.ready).toBe(false)
    expect(eliminarArticulo).not.toHaveBeenCalled()
    expect(eliminarLista).toHaveBeenCalledWith('lista-1')

    await act(async () => {
      persistencia.rechazar(new Error('denied'))
      await expect(borrado.isPersisted.promise).rejects.toThrow('denied')
    })
  })

  it('restores the complete child subtree when the parent list deletion fails', async () => {
    const recursos = await montarRecursos({
      articulos: [
        articulo('a'),
        articulo('b', { createdAt: '2026-01-02T00:00:00.000Z' }),
      ],
    })
    useRecursosListas.mockReturnValue(recursos)
    const persistencia = diferido<void>()
    eliminarLista.mockReturnValue(persistencia.promesa)
    const { result } = renderHook(() => useArticulos('lista-1'))

    const borrado = recursos.listas.delete('lista-1')
    await act(async () => undefined)
    expect(result.current.articulos).toEqual([])

    await act(async () => {
      persistencia.rechazar(new Error('denied'))
      await expect(borrado.isPersisted.promise).rejects.toThrow('denied')
    })

    expect(result.current.articulos.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(result.current.ready).toBe(true)
    expect(eliminarArticulo).not.toHaveBeenCalled()
  })

  it('refuses a retained action from a previous list after the hook moves to another list', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        listas: [listaFija('lista-1'), listaFija('lista-2')],
        articulos: [articulo('a'), articulo('b', { listaId: 'lista-2' })],
      }),
    )
    const { result, rerender } = renderHook(({ id }) => useArticulos(id), {
      initialProps: { id: 'lista-1' },
    })
    const agregarEnLista1 = result.current.agregar
    const editarEnLista1 = result.current.editar
    rerender({ id: 'lista-2' })

    await expect(agregarEnLista1('Leche')).resolves.toMatchObject({
      ok: false,
    })
    await expect(editarEnLista1('a', 'Pan')).resolves.toMatchObject({
      ok: false,
    })
    expect(insertarArticulo).not.toHaveBeenCalled()
    expect(actualizarArticulo).not.toHaveBeenCalled()
  })

  it('refuses a retained household-A action after household B becomes current', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({ articulos: [articulo('a')] }),
    )
    const { result, rerender } = renderHook(() => useArticulos('lista-1'))
    const editarDesdeA = result.current.editar
    const limpiarDesdeA = result.current.limpiarComprados
    useHogar.mockReturnValue({
      estado: 'ready',
      hogar: { id: 'hogar-2', nombre: 'B' },
      miembros: [],
    })
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        householdId: 'hogar-2',
        listas: [listaFija('lista-1', { householdId: 'hogar-2' })],
        articulos: [],
      }),
    )
    rerender()

    await expect(editarDesdeA('a', 'Pan')).resolves.toMatchObject({
      ok: false,
    })
    await expect(limpiarDesdeA()).resolves.toMatchObject({ ok: false })
    expect(actualizarArticulo).not.toHaveBeenCalled()
    expect(eliminarArticulo).not.toHaveBeenCalled()
  })

  it('keeps the current list error when a previous-list failure settles late', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({
        listas: [listaFija('lista-1'), listaFija('lista-2')],
        articulos: [articulo('a')],
      }),
    )
    const persistencia = diferido<Articulo>()
    actualizarArticulo.mockReturnValue(persistencia.promesa)
    const { result, rerender } = renderHook(({ id }) => useArticulos(id), {
      initialProps: { id: 'lista-1' },
    })

    let pendiente!: Promise<Resultado<void>>
    await act(async () => {
      pendiente = result.current.editar('a', 'Pan')
    })
    rerender({ id: 'lista-2' })

    await act(async () => {
      await expect(result.current.agregar('   ')).resolves.toMatchObject({
        ok: false,
        error: { tipo: 'validation' },
      })
    })
    expect(result.current.error).toMatchObject({ tipo: 'validation' })

    await act(async () => {
      persistencia.rechazar(new Error('offline'))
      await expect(pendiente).resolves.toMatchObject({ ok: false })
    })

    expect(result.current.error).toMatchObject({ tipo: 'validation' })
  })

  it('clears the previous error once a later action succeeds', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({ articulos: [articulo('a')] }),
    )
    const { result } = renderHook(() => useArticulos('lista-1'))

    await act(async () => {
      await expect(result.current.agregar('   ')).resolves.toMatchObject({
        ok: false,
      })
    })
    expect(result.current.error).toMatchObject({ tipo: 'validation' })

    await act(async () => {
      await expect(result.current.agregar('Leche')).resolves.toMatchObject({
        ok: true,
      })
    })
    expect(result.current.error).toBeUndefined()
  })

  it('hides all child projections when the parent list is no longer current', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos({ listas: [], articulos: [articulo('a')] }),
    )
    const { result } = renderHook(() => useArticulos('lista-1'))
    expect(result.current).toMatchObject({
      articulos: [],
      ready: false,
      loading: true,
    })
  })

  it('exposes a realtime household error with an empty, non-ready projection and refuses to write', async () => {
    useHogar.mockReturnValue({
      estado: 'error',
      error: Object.assign(new Error('socket dropped'), { tipo: 'realtime' }),
    })
    // The resource still holds this list's rows: the empty projection below
    // must come from the hook honoring the household error, not from an
    // absent collection or a missing parent list.
    useRecursosListas.mockReturnValue(
      await montarRecursos({ articulos: [articulo('a', { comprado: true })] }),
    )
    const { result } = renderHook(() => useArticulos('lista-1'))

    expect(result.current).toMatchObject({
      articulos: [],
      ready: false,
      loading: true,
      error: { tipo: 'realtime', message: 'socket dropped' },
    })

    await act(async () => {
      await expect(result.current.agregar('Leche')).resolves.toMatchObject({
        ok: false,
        error: { tipo: 'validation' },
      })
      await expect(result.current.limpiarComprados()).resolves.toMatchObject({
        ok: false,
        error: { tipo: 'validation' },
      })
    })
    expect(insertarArticulo).not.toHaveBeenCalled()
    expect(eliminarArticulo).not.toHaveBeenCalled()
  })

  it('exposes a non-realtime household error as a new realtime error without relabeling the shared object', async () => {
    // Every `useHogar()` consumer holds this same object. The hook must not
    // relabel it in place, or the household's own discriminator is lost.
    const errorHogar = Object.assign(new Error('household id is not a uuid'), {
      tipo: 'configuracion' as const,
    })
    useHogar.mockReturnValue({ estado: 'error', error: errorHogar })
    useRecursosListas.mockReturnValue(await montarRecursos())
    const { result } = renderHook(() => useArticulos('lista-1'))

    expect(errorHogar.tipo).toBe('configuracion')
    expect(result.current.error).not.toBe(errorHogar)
    expect(result.current.error).toMatchObject({
      tipo: 'realtime',
      message: 'household id is not a uuid',
      cause: errorHogar,
    })
  })
})
