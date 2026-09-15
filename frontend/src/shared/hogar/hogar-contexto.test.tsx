import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { render, renderHook, waitFor } from '@testing-library/react'
import { HogarProvider, useHogar } from './hogar-contexto'
import type { EstadoHogar } from './hogar-contexto'

const { useSesion, resolverHogar } = vi.hoisted(() => ({
  useSesion: vi.fn(),
  resolverHogar: vi.fn(),
}))
vi.mock('./sesion-contexto', () => ({ useSesion }))
vi.mock('./hogar-repository', () => ({ resolverHogar }))

function Wrapper({ children }: { children: ReactNode }) {
  return <HogarProvider>{children}</HogarProvider>
}

// Records what `useHogar()` returned on EVERY render, including the render
// React performs before any effect runs. `result.current` from `renderHook`
// is only read after `act()` settles, which is exactly the window a stale
// household can hide in.
function Registro({ registro }: { registro: EstadoHogar[] }) {
  registro.push(useHogar())
  return null
}

describe('HogarProvider / useHogar', () => {
  beforeEach(() => {
    // `resetAllMocks`, not `clearAllMocks`: a queued once-implementation a
    // case never consumed must not leak into the next one.
    vi.resetAllMocks()
    useSesion.mockReturnValue({
      user: { id: 'u-1' },
      loading: false,
      error: null,
    })
  })

  it('exposes a resolved household without exposing SDK data', async () => {
    resolverHogar.mockResolvedValue({
      estado: 'ready',
      hogar: { id: 'h-1', nombre: 'Casa' },
      miembros: [
        { id: 'm-1', householdId: 'h-1', userId: 'u-1', nombre: 'Ana' },
      ],
    })

    const { result } = renderHook(() => useHogar(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.estado).toBe('ready'))
    expect(result.current).toMatchObject({
      estado: 'ready',
      hogar: { id: 'h-1', nombre: 'Casa' },
    })
  })

  it('keeps a new session loading until its own resolution wins', async () => {
    let resolverA!: (valor: unknown) => void
    resolverHogar.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverA = resolve
        }),
    )
    const { result, rerender } = renderHook(() => useHogar(), {
      wrapper: Wrapper,
    })
    useSesion.mockReturnValue({
      user: { id: 'u-2' },
      loading: false,
      error: null,
    })
    resolverHogar.mockResolvedValueOnce({
      estado: 'ready',
      hogar: { id: 'h-2', nombre: 'Nueva casa' },
      miembros: [],
    })
    rerender()

    expect(result.current.estado).toBe('loading')
    resolverA({
      estado: 'ready',
      hogar: { id: 'h-1', nombre: 'Vieja' },
      miembros: [],
    })
    await waitFor(() =>
      expect(result.current).toMatchObject({
        estado: 'ready',
        hogar: { id: 'h-2' },
      }),
    )
  })

  it('clears a ready household immediately on sign-out and never restores it', async () => {
    resolverHogar.mockResolvedValueOnce({
      estado: 'ready',
      hogar: { id: 'h-1', nombre: 'Casa anterior' },
      miembros: [],
    })
    const { result, rerender } = renderHook(() => useHogar(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.estado).toBe('ready'))

    useSesion.mockReturnValue({ user: null, loading: false, error: null })
    rerender()

    expect(result.current).toEqual({ estado: 'loading' })
    expect(resolverHogar).toHaveBeenCalledTimes(1)
  })

  it('rejects a late household A resolution after a Strict Mode A to B replacement', async () => {
    let resolverA!: (valor: unknown) => void
    let resolverB!: (valor: unknown) => void
    resolverHogar.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolverA = resolve
        }),
    )
    resolverHogar.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolverB = resolve
        }),
    )
    const StrictWrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>
        <Wrapper>{children}</Wrapper>
      </StrictMode>
    )
    const { result, rerender } = renderHook(() => useHogar(), {
      wrapper: StrictWrapper,
    })

    useSesion.mockReturnValue({
      user: { id: 'u-2' },
      loading: false,
      error: null,
    })
    rerender()
    resolverB({
      estado: 'ready',
      hogar: { id: 'h-2', nombre: 'Casa nueva' },
      miembros: [],
    })
    await waitFor(() =>
      expect(result.current).toMatchObject({
        estado: 'ready',
        hogar: { id: 'h-2' },
      }),
    )

    resolverA({
      estado: 'ready',
      hogar: { id: 'h-1', nombre: 'Casa anterior' },
      miembros: [],
    })
    await waitFor(() =>
      expect(result.current).toMatchObject({
        estado: 'ready',
        hogar: { id: 'h-2' },
      }),
    )
  })

  it.each([
    ['a different session', { id: 'u-2' }],
    ['sign-out', null],
  ])(
    'never lets a child render observe the previous household during %s',
    async (_transicion, user) => {
      resolverHogar.mockResolvedValueOnce({
        estado: 'ready',
        hogar: { id: 'h-1', nombre: 'Casa anterior' },
        miembros: [],
      })
      const registro: EstadoHogar[] = []
      // A fresh element per render: React bails out of re-rendering a
      // provider handed the identical element object, which would hide the
      // session change this case exists to observe.
      const arbol = () => (
        <HogarProvider>
          <Registro registro={registro} />
        </HogarProvider>
      )
      const { rerender } = render(arbol())
      await waitFor(() =>
        expect(registro.at(-1)).toMatchObject({
          estado: 'ready',
          hogar: { id: 'h-1' },
        }),
      )

      useSesion.mockReturnValue({ user, loading: false, error: null })
      resolverHogar.mockImplementation(() => new Promise(() => {}))
      registro.length = 0
      rerender(arbol())

      expect(registro.length).toBeGreaterThan(0)
      expect(registro.map((estado) => estado.estado)).toEqual(
        registro.map(() => 'loading'),
      )
    },
  )

  it('drops an in-flight resolution once the provider unmounts', async () => {
    let resolver!: (valor: unknown) => void
    resolverHogar.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )
    const registro: EstadoHogar[] = []
    const { unmount } = render(
      <HogarProvider>
        <Registro registro={registro} />
      </HogarProvider>,
    )
    expect(registro.at(-1)).toEqual({ estado: 'loading' })

    unmount()
    const rendersAntes = registro.length
    resolver({
      estado: 'ready',
      hogar: { id: 'h-1', nombre: 'Casa' },
      miembros: [],
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(registro.length).toBe(rendersAntes)
    expect(registro.some((estado) => estado.estado === 'ready')).toBe(false)
  })
})
