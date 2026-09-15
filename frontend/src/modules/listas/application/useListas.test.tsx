import { act, renderHook } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { crearListasCollection } from '../infrastructure/listasCollection'
import { useListas } from './useListas'
import type { Lista } from '../domain/lista'
import type { Resultado } from './useListas'

// Only the household/session/resource-boundary seams are faked. The list
// collection itself is the real `crearListasCollection` factory, so every
// projection, optimistic mutation and rollback below is produced by the real
// TanStack DB transaction pipeline rather than by a stub.
const { useHogar, useSesion, useRecursosListas } = vi.hoisted(() => ({
  useHogar: vi.fn(),
  useSesion: vi.fn(),
  useRecursosListas: vi.fn(),
}))
vi.mock('@/shared/hogar/hogar-contexto', () => ({ useHogar }))
vi.mock('@/shared/hogar/sesion-contexto', () => ({ useSesion }))
vi.mock('./hogar-listas', () => ({ useRecursosListas }))

// The PostgREST repository is the single mocked boundary: `obtenerListas` is
// the collection's `queryFn` (its server read, replayed after every mutation
// handler) and the three write functions are its persistence handlers.
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

const lista = (
  id: string,
  overrides: Partial<Lista> = {},
  createdAt = '2026-01-01T00:00:00.000Z',
): Lista => ({
  id,
  householdId: 'hogar-1',
  nombre: id,
  createdAt,
  createdBy: 'u-1',
  updatedAt: createdAt,
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

async function montarRecursos(
  householdId = 'hogar-1',
  filas: Array<Lista> = [],
) {
  obtenerListas.mockResolvedValue(filas)
  const queryClient = new QueryClient()
  const listas = crearListasCollection(queryClient, householdId)
  await listas.preload()
  return { householdId, listas }
}

describe('useListas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useHogar.mockReturnValue({
      estado: 'ready',
      hogar: { id: 'hogar-1', nombre: 'Casa' },
      miembros: [],
    })
    useSesion.mockReturnValue({ user: { id: 'u-1' } })
    insertarLista.mockResolvedValue(undefined)
    actualizarLista.mockResolvedValue(undefined)
    eliminarLista.mockResolvedValue(undefined)
  })

  it('projects only current-household lists in createdAt and ID order', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [
        lista('b', {}, '2026-01-02T00:00:00.000Z'),
        lista('a'),
        lista('ajena', { householdId: 'hogar-2' }),
      ]),
    )
    const { result } = renderHook(() => useListas())
    expect(result.current.listas.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(result.current).toMatchObject({ ready: true, loading: false })
  })

  it('rejects invalid and unavailable mutations before persistence', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [lista('a')]),
    )
    const { result } = renderHook(() => useListas())
    await expect(result.current.crear('   ')).resolves.toMatchObject({
      ok: false,
      error: { tipo: 'validation' },
    })
    await expect(
      result.current.renombrar('inexistente', 'Nueva'),
    ).resolves.toMatchObject({ ok: false })
    await expect(result.current.eliminar('inexistente')).resolves.toMatchObject(
      { ok: false },
    )
    expect(insertarLista).not.toHaveBeenCalled()
    expect(actualizarLista).not.toHaveBeenCalled()
    expect(eliminarLista).not.toHaveBeenCalled()
  })

  it('awaits optimistic create, rename, and delete persistence outcomes and exposes failures', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [lista('a')]),
    )
    actualizarLista.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useListas())

    await act(async () => {
      await expect(result.current.crear(' Compra ')).resolves.toMatchObject({
        ok: true,
      })
      await expect(
        result.current.renombrar('a', 'Nueva'),
      ).resolves.toMatchObject({ ok: false, error: { tipo: 'persistence' } })
      await expect(result.current.eliminar('a')).resolves.toMatchObject({
        ok: true,
      })
    })

    expect(insertarLista).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Compra', householdId: 'hogar-1' }),
    )
    expect(eliminarLista).toHaveBeenCalledWith('a')
  })

  it('rejects a retained A callback after household B becomes current', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [lista('a')]),
    )
    const { result, rerender } = renderHook(() => useListas())
    const crearDesdeA = result.current.crear
    useHogar.mockReturnValue({
      estado: 'ready',
      hogar: { id: 'hogar-2', nombre: 'B' },
      miembros: [],
    })
    useRecursosListas.mockReturnValue(await montarRecursos('hogar-2', []))
    rerender()

    await expect(crearDesdeA('Compra')).resolves.toMatchObject({ ok: false })
    expect(insertarLista).not.toHaveBeenCalled()
  })

  it('keeps an optimistic list visible while its create is pending and converges on the server echo', async () => {
    useRecursosListas.mockReturnValue(await montarRecursos('hogar-1', []))
    const persistencia = diferido<void>()
    insertarLista.mockReturnValue(persistencia.promesa)
    const { result } = renderHook(() => useListas())

    let pendiente!: Promise<Resultado<string>>
    await act(async () => {
      pendiente = result.current.crear(' Compra ')
    })

    expect(result.current.listas).toEqual([
      expect.objectContaining({
        nombre: 'Compra',
        householdId: 'hogar-1',
        createdBy: 'u-1',
      }),
    ])
    const provisional = result.current.listas[0]

    obtenerListas.mockResolvedValue([
      {
        ...provisional,
        nombre: 'Compra',
        updatedAt: '2026-03-01T00:00:00.000Z',
        updatedBy: 'otro-dispositivo',
      },
    ])
    await act(async () => {
      persistencia.resolver()
      await expect(pendiente).resolves.toMatchObject({
        ok: true,
        valor: provisional.id,
      })
    })

    expect(result.current.listas).toEqual([
      expect.objectContaining({
        id: provisional.id,
        updatedAt: '2026-03-01T00:00:00.000Z',
        updatedBy: 'otro-dispositivo',
      }),
    ])
  })

  it('restores the previous list name when the rename persistence fails', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [lista('a', { nombre: 'Semanal' })]),
    )
    actualizarLista.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useListas())
    expect(result.current.listas.map(({ nombre }) => nombre)).toEqual([
      'Semanal',
    ])

    await act(async () => {
      await expect(
        result.current.renombrar('a', 'Mensual'),
      ).resolves.toMatchObject({ ok: false, error: { tipo: 'persistence' } })
    })

    expect(result.current.listas.map(({ nombre }) => nombre)).toEqual([
      'Semanal',
    ])
    expect(result.current.error).toMatchObject({ tipo: 'persistence' })
  })

  it('hides a list while its delete is pending and restores it in order when persistence fails', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [
        lista('a'),
        lista('b', {}, '2026-01-02T00:00:00.000Z'),
      ]),
    )
    const persistencia = diferido<void>()
    eliminarLista.mockReturnValue(persistencia.promesa)
    const { result } = renderHook(() => useListas())

    let pendiente!: Promise<Resultado<void>>
    await act(async () => {
      pendiente = result.current.eliminar('a')
    })
    expect(result.current.listas.map(({ id }) => id)).toEqual(['b'])

    await act(async () => {
      persistencia.rechazar(new Error('denied'))
      await expect(pendiente).resolves.toMatchObject({ ok: false })
    })

    expect(result.current.listas.map(({ id }) => id)).toEqual(['a', 'b'])
  })

  // The collection itself yields tied records in codepoint order ('B' before
  // 'a'), so these mixed-case IDs are what makes the hook's own
  // `localeCompare` tiebreaker observable: without it the projection would
  // simply echo the storage order.
  it('breaks createdAt ties by ID so the projection order is deterministic', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [
        lista('c', {}, '2026-01-01T00:00:00.000Z'),
        lista('a', {}, '2026-01-01T00:00:00.000Z'),
        lista('B', {}, '2026-01-01T00:00:00.000Z'),
      ]),
    )
    const { result } = renderHook(() => useListas())
    expect(result.current.listas.map(({ id }) => id)).toEqual(['a', 'B', 'c'])
  })

  it('keeps the current scope error when a household A failure settles after household B is current', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [lista('a')]),
    )
    const persistencia = diferido<void>()
    actualizarLista.mockReturnValue(persistencia.promesa)
    const { result, rerender } = renderHook(() => useListas())

    let pendiente!: Promise<Resultado<void>>
    await act(async () => {
      pendiente = result.current.renombrar('a', 'Nueva')
    })

    useHogar.mockReturnValue({
      estado: 'ready',
      hogar: { id: 'hogar-2', nombre: 'B' },
      miembros: [],
    })
    useRecursosListas.mockReturnValue(await montarRecursos('hogar-2', []))
    rerender()

    await act(async () => {
      await expect(result.current.crear('   ')).resolves.toMatchObject({
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
      await montarRecursos('hogar-1', [lista('a')]),
    )
    const { result } = renderHook(() => useListas())

    await act(async () => {
      await expect(result.current.crear('   ')).resolves.toMatchObject({
        ok: false,
      })
    })
    expect(result.current.error).toMatchObject({ tipo: 'validation' })

    await act(async () => {
      await expect(result.current.crear('Compra')).resolves.toMatchObject({
        ok: true,
      })
    })
    expect(result.current.error).toBeUndefined()
  })

  it('clears its projection synchronously when a stale household resource is retained', async () => {
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-a', [lista('a', { householdId: 'hogar-a' })]),
    )
    const { result } = renderHook(() => useListas())
    expect(result.current).toMatchObject({
      listas: [],
      ready: false,
      loading: true,
    })
  })

  it('exposes a realtime household error with an empty, non-ready projection and refuses to write', async () => {
    useHogar.mockReturnValue({
      estado: 'error',
      error: Object.assign(new Error('socket dropped'), { tipo: 'realtime' }),
    })
    // The resource still holds this household's rows: the empty projection
    // below must come from the hook honoring the household error, not from
    // an absent collection.
    useRecursosListas.mockReturnValue(
      await montarRecursos('hogar-1', [lista('a')]),
    )
    const { result } = renderHook(() => useListas())

    expect(result.current).toMatchObject({
      listas: [],
      ready: false,
      loading: true,
      error: { tipo: 'realtime', message: 'socket dropped' },
    })

    await act(async () => {
      await expect(result.current.crear('Compra')).resolves.toMatchObject({
        ok: false,
        error: { tipo: 'validation' },
      })
    })
    expect(insertarLista).not.toHaveBeenCalled()
  })

  it('exposes a non-realtime household error as a new realtime error without relabeling the shared object', async () => {
    // Every `useHogar()` consumer holds this same object. The hook must not
    // relabel it in place, or the household's own discriminator is lost.
    const errorHogar = Object.assign(new Error('household id is not a uuid'), {
      tipo: 'configuracion' as const,
    })
    useHogar.mockReturnValue({ estado: 'error', error: errorHogar })
    useRecursosListas.mockReturnValue(await montarRecursos('hogar-1'))
    const { result } = renderHook(() => useListas())

    expect(errorHogar.tipo).toBe('configuracion')
    expect(result.current.error).not.toBe(errorHogar)
    expect(result.current.error).toMatchObject({
      tipo: 'realtime',
      message: 'household id is not a uuid',
      cause: errorHogar,
    })
  })
})
