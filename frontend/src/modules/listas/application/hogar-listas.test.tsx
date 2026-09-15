import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { HogarProvider, useHogar } from '@/shared/hogar/hogar-contexto'
import type { EstadoHogar } from '@/shared/hogar/hogar-contexto'
import { HogarListas, useRecursosListas } from './hogar-listas'
import type * as Realtime from '../infrastructure/realtime'

const {
  crearListasCollection,
  crearArticulosCollection,
  iniciarSuscripcionHogar,
} = vi.hoisted(() => ({
  crearListasCollection: vi.fn(),
  crearArticulosCollection: vi.fn(),
  iniciarSuscripcionHogar: vi.fn(),
}))
vi.mock('../infrastructure/listasCollection', () => ({ crearListasCollection }))
vi.mock('../infrastructure/articulosCollection', () => ({
  crearArticulosCollection,
}))
vi.mock('../infrastructure/realtime', () => ({ iniciarSuscripcionHogar }))

// The real `HogarProvider` composition (session → resolution → boundary) is
// exercised with only its two external edges faked, so the boundary's
// conditional mount/unmount is the real one.
const { useSesion, resolverHogar } = vi.hoisted(() => ({
  useSesion: vi.fn(),
  resolverHogar: vi.fn(),
}))
vi.mock('@/shared/hogar/sesion-contexto', () => ({ useSesion }))
vi.mock('@/shared/hogar/hogar-repository', () => ({ resolverHogar }))

// In-memory `insforge.realtime`, same shape as in `realtime.test.ts`. Only
// the real-ownership case routes the realtime mock to the real module so it
// can count the handlers actually registered on the shared socket.
const { realtime, escuchas } = vi.hoisted(() => {
  const registradas = new Map<string, Set<(payload: unknown) => void>>()
  return {
    escuchas: registradas,
    realtime: {
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue({
        ok: true,
        channel: '',
        presence: { members: [] },
      }),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      on: vi.fn((evento: string, callback: (payload: unknown) => void) => {
        if (!registradas.has(evento)) registradas.set(evento, new Set())
        registradas.get(evento)?.add(callback)
      }),
      off: vi.fn((evento: string, callback: (payload: unknown) => void) => {
        registradas.get(evento)?.delete(callback)
      }),
    },
  }
})
vi.mock('@/shared/api/insforge', () => ({ insforge: { realtime } }))
const realtimeReal = await vi.importActual<typeof Realtime>(
  '../infrastructure/realtime',
)

const EVENTOS_DEL_CANAL = [
  'list.insert',
  'list.update',
  'list.delete',
  'item.insert',
  'item.update',
  'item.delete',
  'error',
  'connect_error',
]

function collection() {
  return {
    preload: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
  }
}

// Lets every already-queued microtask (deferred setups, the cleanup queue)
// settle without waiting on a specific observable.
function drenar() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function Probe({ children }: { children?: ReactNode }) {
  const recursos = useRecursosListas()
  return (
    <output data-testid="estado">
      {recursos ? recursos.householdId : 'loading'}
      {children}
    </output>
  )
}

// Records the public household state on every render, so the case below can
// assert what a consumer observed rather than only what it observes now.
function ProbeHogar({ registro }: { registro: EstadoHogar[] }) {
  registro.push(useHogar())
  return <Probe />
}

function renderBoundary(
  hogar = { id: 'hogar-1', nombre: 'Casa' },
  options: { strict?: boolean } = {},
) {
  const queryClient = new QueryClient()
  const contenido = (
    <QueryClientProvider client={queryClient}>
      <HogarListas hogar={hogar} alError={vi.fn()}>
        <Probe />
      </HogarListas>
    </QueryClientProvider>
  )
  return {
    queryClient,
    ...render(
      options.strict ? <StrictMode>{contenido}</StrictMode> : contenido,
    ),
  }
}

describe('HogarListas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    escuchas.clear()
    crearListasCollection.mockImplementation(collection)
    crearArticulosCollection.mockImplementation(collection)
    iniciarSuscripcionHogar.mockResolvedValue({
      detener: vi.fn().mockResolvedValue(undefined),
    })
    useSesion.mockReturnValue({
      user: { id: 'u-1' },
      loading: false,
      error: null,
    })
  })

  it('does not publish resources until both household collections preload and subscribe', async () => {
    const { getByTestId, queryClient } = renderBoundary()
    expect(getByTestId('estado')).toHaveTextContent('loading')
    await waitFor(() =>
      expect(getByTestId('estado')).toHaveTextContent('hogar-1'),
    )
    expect(crearListasCollection).toHaveBeenCalledWith(queryClient, 'hogar-1')
    expect(iniciarSuscripcionHogar).toHaveBeenCalledWith(
      'hogar-1',
      expect.any(Object),
      expect.any(Function),
      expect.any(AbortSignal),
    )
  })

  it('keeps exactly one active subscription after Strict Mode replays setup', async () => {
    // Real subscription owner over the fake socket: ownership is asserted on
    // what is actually registered and subscribed, not on how often the
    // boundary called a mock.
    iniciarSuscripcionHogar.mockImplementation(
      realtimeReal.iniciarSuscripcionHogar,
    )
    const { getByTestId, unmount } = renderBoundary(undefined, {
      strict: true,
    })

    await waitFor(() =>
      expect(getByTestId('estado')).toHaveTextContent('hogar-1'),
    )
    expect(realtime.subscribe).toHaveBeenCalledTimes(1)
    expect(realtime.subscribe).toHaveBeenCalledWith('household:hogar-1')
    expect(realtime.unsubscribe).not.toHaveBeenCalled()
    for (const evento of EVENTOS_DEL_CANAL) {
      expect(escuchas.get(evento)?.size, evento).toBe(1)
    }

    unmount()
    await waitFor(() => expect(realtime.unsubscribe).toHaveBeenCalledTimes(1))
    expect(realtime.unsubscribe).toHaveBeenCalledWith('household:hogar-1')
    expect(realtime.disconnect).not.toHaveBeenCalled()
    for (const evento of EVENTOS_DEL_CANAL) {
      expect(escuchas.get(evento)?.size, evento).toBe(0)
    }
  })

  it('cleans household A before it publishes B and removes only A query keys', async () => {
    const primera = collection()
    const primeraArticulos = collection()
    const segunda = collection()
    const segundaArticulos = collection()
    crearListasCollection
      .mockReturnValueOnce(primera)
      .mockReturnValueOnce(segunda)
    crearArticulosCollection
      .mockReturnValueOnce(primeraArticulos)
      .mockReturnValueOnce(segundaArticulos)
    const detenerA = vi.fn().mockResolvedValue(undefined)
    iniciarSuscripcionHogar
      .mockResolvedValueOnce({ detener: detenerA })
      .mockResolvedValueOnce({ detener: vi.fn() })
    const queryClient = new QueryClient()
    const alError = vi.fn()
    const { getByTestId, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <HogarListas hogar={{ id: 'hogar-a', nombre: 'A' }} alError={alError}>
          <Probe />
        </HogarListas>
      </QueryClientProvider>,
    )
    await waitFor(() =>
      expect(getByTestId('estado')).toHaveTextContent('hogar-a'),
    )
    const remove = vi.spyOn(queryClient, 'removeQueries')
    rerender(
      <QueryClientProvider client={queryClient}>
        <HogarListas hogar={{ id: 'hogar-b', nombre: 'B' }} alError={alError}>
          <Probe />
        </HogarListas>
      </QueryClientProvider>,
    )

    expect(getByTestId('estado')).toHaveTextContent('loading')
    await waitFor(() =>
      expect(getByTestId('estado')).toHaveTextContent('hogar-b'),
    )
    expect(detenerA).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith({ queryKey: ['listas', 'hogar-a'] })
    expect(remove).toHaveBeenCalledWith({ queryKey: ['articulos', 'hogar-a'] })
  })

  it('does not leak a deferred setup after unmount and forwards connection failure', async () => {
    let terminar!: (value: { detener: () => Promise<void> }) => void
    const detener = vi.fn().mockResolvedValue(undefined)
    iniciarSuscripcionHogar.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          terminar = resolve
        }),
    )
    const { getByTestId, unmount } = renderBoundary()
    expect(getByTestId('estado')).toHaveTextContent('loading')
    await waitFor(() =>
      expect(iniciarSuscripcionHogar).toHaveBeenCalledTimes(1),
    )
    unmount()
    terminar({ detener })
    await waitFor(() => expect(detener).toHaveBeenCalledTimes(1))
  })

  it('reports a failed preload without publishing a stale resource', async () => {
    crearListasCollection.mockReturnValue({
      ...collection(),
      preload: vi.fn().mockRejectedValue(new Error('offline')),
    })
    const alError = vi.fn()
    const queryClient = new QueryClient()
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <HogarListas
          hogar={{ id: 'hogar-1', nombre: 'Casa' }}
          alError={alError}
        >
          <Probe />
        </HogarListas>
      </QueryClientProvider>,
    )
    await waitFor(() =>
      expect(alError).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'realtime' }),
      ),
    )
    expect(getByTestId('estado')).toHaveTextContent('loading')
  })

  it('stops a subscription that settles after unmount before it cleans the collections', async () => {
    let terminar!: (value: { detener: () => Promise<void> }) => void
    const detener = vi.fn().mockResolvedValue(undefined)
    iniciarSuscripcionHogar.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          terminar = resolve
        }),
    )
    const listas = collection()
    crearListasCollection.mockReturnValueOnce(listas)
    const { unmount } = renderBoundary()
    await waitFor(() =>
      expect(iniciarSuscripcionHogar).toHaveBeenCalledTimes(1),
    )

    unmount()
    await drenar()
    // Teardown waits for the pending setup: nothing may be released while
    // the subscription it must stop first does not exist yet.
    expect(listas.cleanup).not.toHaveBeenCalled()

    terminar({ detener })
    await waitFor(() => expect(listas.cleanup).toHaveBeenCalledTimes(1))
    expect(detener).toHaveBeenCalledTimes(1)
    expect(detener.mock.invocationCallOrder[0]).toBeLessThan(
      listas.cleanup.mock.invocationCallOrder[0],
    )
  })

  it('removes the household cache again after an aborted preload settles', async () => {
    const queryClient = new QueryClient()
    let terminarPreload!: () => void
    const listas = {
      cleanup: vi.fn().mockResolvedValue(undefined),
      preload: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            terminarPreload = () => {
              // What a real query collection does when its fetch lands:
              // write the rows into the shared query cache.
              queryClient.setQueryData(
                ['listas', 'hogar-1'],
                [{ id: 'lista-tardia' }],
              )
              resolve()
            }
          }),
      ),
    }
    crearListasCollection.mockReturnValueOnce(listas)
    const { getByTestId, unmount } = render(
      <QueryClientProvider client={queryClient}>
        <HogarListas
          hogar={{ id: 'hogar-1', nombre: 'Casa' }}
          alError={vi.fn()}
        >
          <Probe />
        </HogarListas>
      </QueryClientProvider>,
    )
    await waitFor(() => expect(listas.preload).toHaveBeenCalledTimes(1))
    expect(getByTestId('estado')).toHaveTextContent('loading')

    unmount()
    await drenar()
    terminarPreload()

    await waitFor(() => expect(listas.cleanup).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(queryClient.getQueryData(['listas', 'hogar-1'])).toBeUndefined(),
    )
    expect(iniciarSuscripcionHogar).not.toHaveBeenCalled()
  })

  it('does not let a remounted boundary set up until the previous teardown finished', async () => {
    const queryClient = new QueryClient()
    let liberarA!: () => void
    const detenerA = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          liberarA = resolve
        }),
    )
    iniciarSuscripcionHogar
      .mockResolvedValueOnce({ detener: detenerA })
      .mockResolvedValueOnce({ detener: vi.fn().mockResolvedValue(undefined) })
    resolverHogar.mockResolvedValue({
      estado: 'ready',
      hogar: { id: 'hogar-a', nombre: 'A' },
      miembros: [],
    })
    // Fresh element per render so the provider re-reads the session.
    const arbol = () => (
      <QueryClientProvider client={queryClient}>
        <HogarProvider recurso={HogarListas}>
          <Probe />
        </HogarProvider>
      </QueryClientProvider>
    )
    const { getByTestId, rerender } = render(arbol())
    await waitFor(() =>
      expect(getByTestId('estado')).toHaveTextContent('hogar-a'),
    )

    // The session goes back to loading: `HogarProvider` unmounts the
    // boundary while household A's subscription is still being stopped.
    useSesion.mockReturnValue({ user: null, loading: true, error: null })
    rerender(arbol())
    expect(getByTestId('estado')).toHaveTextContent('loading')
    await waitFor(() => expect(detenerA).toHaveBeenCalledTimes(1))

    // A new session resolves to the same household, so a fresh boundary
    // instance mounts against the very cache keys A is still retiring.
    useSesion.mockReturnValue({
      user: { id: 'u-2' },
      loading: false,
      error: null,
    })
    rerender(arbol())
    await waitFor(() => expect(crearListasCollection).toHaveBeenCalledTimes(2))
    await drenar()

    expect(iniciarSuscripcionHogar).toHaveBeenCalledTimes(1)
    expect(getByTestId('estado')).toHaveTextContent('loading')

    liberarA()
    await waitFor(() =>
      expect(getByTestId('estado')).toHaveTextContent('hogar-a'),
    )
    expect(iniciarSuscripcionHogar).toHaveBeenCalledTimes(2)
  })

  it('exposes a realtime failure reported after ready as a household error without re-creating the boundary', async () => {
    // Real composition (session → resolution → boundary → realtime reporter):
    // the subscription is established and only later reports a socket
    // failure, which is the path `alError` takes in production.
    let reportar!: (fallo: Realtime.FalloRealtime) => void
    iniciarSuscripcionHogar.mockImplementationOnce(
      async (
        _hogar: string,
        _colecciones: unknown,
        alReportar: (fallo: Realtime.FalloRealtime) => void,
      ) => {
        reportar = alReportar
        return { detener: vi.fn().mockResolvedValue(undefined) }
      },
    )
    resolverHogar.mockResolvedValue({
      estado: 'ready',
      hogar: { id: 'hogar-1', nombre: 'Casa' },
      miembros: [],
    })
    const registro: EstadoHogar[] = []
    const { getByTestId } = render(
      <QueryClientProvider client={new QueryClient()}>
        <HogarProvider recurso={HogarListas}>
          <ProbeHogar registro={registro} />
        </HogarProvider>
      </QueryClientProvider>,
    )
    await waitFor(() =>
      expect(getByTestId('estado')).toHaveTextContent('hogar-1'),
    )
    expect(registro.at(-1)).toMatchObject({
      estado: 'ready',
      hogar: { id: 'hogar-1' },
    })

    await act(async () => {
      reportar({ tipo: 'socket', causa: new Error('socket dropped') })
    })
    await drenar()

    // The consumer is still rendered and now observes the realtime error
    // with its cause; the shopping resources are withdrawn rather than
    // replaced by a stale or fabricated ready state.
    expect(registro.at(-1)).toMatchObject({
      estado: 'error',
      error: { tipo: 'realtime', message: 'socket dropped' },
    })
    expect(getByTestId('estado')).toHaveTextContent('loading')
    // Nothing restarts implicitly: one resolution, one boundary setup and one
    // subscription for the whole lifetime, so no replacement subscription
    // exists after the failure.
    expect(resolverHogar).toHaveBeenCalledTimes(1)
    expect(crearListasCollection).toHaveBeenCalledTimes(1)
    expect(iniciarSuscripcionHogar).toHaveBeenCalledTimes(1)
  })
})
