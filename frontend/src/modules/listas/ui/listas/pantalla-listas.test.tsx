import { useState } from 'react'
import { act, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import { PantallaListas } from './pantalla-listas'
import type { Lista } from '../../domain/lista'

// Per useListas.test.tsx's boundary-mocking precedent: fake the household
// and application-hook seams the screen calls directly.
const { useHogar } = vi.hoisted(() => ({ useHogar: vi.fn() }))
vi.mock('@/shared/hogar/hogar-contexto', () => ({ useHogar }))
const { useListas, useArticulos } = vi.hoisted(() => ({
  useListas: vi.fn(),
  useArticulos: vi.fn(),
}))
vi.mock('@/modules/listas', () => ({ useListas, useArticulos }))

function lista(id: string, nombre: string): Lista {
  return {
    id,
    householdId: 'hogar-1',
    nombre,
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'u-1',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'u-1',
  }
}

function hogarReady(miembros: number) {
  return {
    estado: 'ready' as const,
    hogar: { id: 'hogar-1', nombre: 'Casa' },
    miembros: Array.from({ length: miembros }, (_, i) => ({
      id: `m-${i}`,
      householdId: 'hogar-1',
      userId: `u-${i}`,
      nombre: `Miembro ${i}`,
    })),
  }
}

type ErrorAplicacionFalso = { tipo: string; message: string }
type ListasBase = {
  listas: Lista[]
  loading: boolean
  ready: boolean
  error: ErrorAplicacionFalso | undefined
  crear: (nombre: string) => Promise<unknown>
  renombrar: (id: string, nombre: string) => Promise<unknown>
  eliminar: (id: string) => Promise<unknown>
}

function listasBase(overrides: Partial<ListasBase> = {}): ListasBase {
  return {
    listas: [],
    loading: false,
    ready: true,
    error: undefined,
    crear: vi.fn(),
    renombrar: vi.fn(),
    eliminar: vi.fn(),
    ...overrides,
  }
}

// PantallaListas composes FilaLista → EnlaceLista (a `Link`) in the
// populated state, so it needs the same hand-built router harness. Router
// matching resolves asynchronously, so every test awaits its first query.
//
// `forzarRerender` re-renders `PantallaListas` from an ancestor `useState`
// tick: this file mocks `useListas`, so nothing signals TanStack Router's
// own (store-subscribed, not prop-subscribed) `Match` to re-invoke it after
// the mock's return value changes — a bare `rerender()` of the same
// `<RouterProvider>` element, and even `router.invalidate()`, both leave it
// unchanged since neither touches the router's own state.
function renderizar() {
  let forzar = () => {}
  function Arnes() {
    const [, set] = useState(0)
    forzar = () => set((n) => n + 1)
    return <PantallaListas />
  }
  const rootRoute = createRootRoute({ component: Arnes })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const utils = render(<RouterProvider router={router} />)
  return {
    router,
    forzarRerender: () => act(() => forzar()),
    ...utils,
  }
}

const usuario = () => userEvent.setup()

describe('PantallaListas', () => {
  beforeEach(() => {
    useArticulos.mockReturnValue({ ready: true, articulos: [] })
  })

  it('renders <h2>Listas</h2> in every state', async () => {
    useHogar.mockReturnValue({ estado: 'loading' })
    useListas.mockReturnValue(listasBase({ ready: false }))
    renderizar()

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Listas' }),
    ).toBeInTheDocument()
  })

  it('shows only the loading indicator when household is loading', async () => {
    useHogar.mockReturnValue({ estado: 'loading' })
    useListas.mockReturnValue(listasBase({ ready: false, loading: true }))
    renderizar()

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows only the loading indicator when household is ready but listas is not ready', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    useListas.mockReturnValue(listasBase({ ready: false, loading: true }))
    renderizar()

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows the no-household empty state with no form when sin-hogar', async () => {
    useHogar.mockReturnValue({ estado: 'sin-hogar' })
    useListas.mockReturnValue(listasBase({ ready: false }))
    renderizar()

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Todavía no formas parte de un hogar',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows a destructive alert banner with no rows and no form on a household error', async () => {
    useHogar.mockReturnValue({
      estado: 'error',
      error: Object.assign(new Error('sin conexión'), { tipo: 'consulta' }),
    })
    useListas.mockReturnValue(
      listasBase({
        ready: false,
        loading: true,
        error: Object.assign(new Error('sin conexión'), { tipo: 'realtime' }),
      }),
    )
    renderizar()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows the no-lists empty state with the create form when ready with zero lists', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    useListas.mockReturnValue(listasBase({ listas: [] }))
    renderizar()

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Todavía no tienes listas',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /nombre/i })).toBeInTheDocument()
  })

  it('shows the create form above the mapped rows when ready with one or more lists', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    useListas.mockReturnValue(
      listasBase({ listas: [lista('a', 'Semanal'), lista('b', 'Fiesta')] }),
    )
    renderizar()

    expect(
      await screen.findByRole('textbox', { name: /nombre/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: 'Listas de la compra' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Semanal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fiesta' })).toBeInTheDocument()
  })

  it('overlays a persistence mutation error as a banner above the form without emptying a populated screen', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    useListas.mockReturnValue(
      listasBase({
        listas: [lista('a', 'Semanal')],
        error: Object.assign(new Error('no se pudo guardar el cambio'), {
          tipo: 'persistence',
        }),
      }),
    )
    renderizar()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Semanal' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /nombre/i })).toBeInTheDocument()
  })

  it('overlays a query mutation error as a banner above the empty state without falling back to the error state', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    useListas.mockReturnValue(
      listasBase({
        listas: [],
        error: Object.assign(new Error('no se pudo cargar'), {
          tipo: 'query',
        }),
      }),
    )
    renderizar()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Todavía no tienes listas',
      }),
    ).toBeInTheDocument()
  })

  it('never surfaces a validation error in the banner', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    useListas.mockReturnValue(
      listasBase({
        listas: [lista('a', 'Semanal')],
        error: Object.assign(new Error('nombre inválido'), {
          tipo: 'validation',
        }),
      }),
    )
    renderizar()

    await screen.findByRole('link', { name: 'Semanal' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the second-member notice only when ready with fewer than two members', async () => {
    useHogar.mockReturnValue(hogarReady(1))
    useListas.mockReturnValue(listasBase({ listas: [] }))
    renderizar()

    expect(
      await screen.findByText(/todavía no hay nadie más/i),
    ).toBeInTheDocument()
  })

  it('hides the second-member notice when ready with two or more members', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    useListas.mockReturnValue(listasBase({ listas: [] }))
    renderizar()

    await screen.findByRole('heading', { level: 2, name: 'Listas' })
    expect(
      screen.queryByText(/todavía no hay nadie más/i),
    ).not.toBeInTheDocument()
  })

  it('hides the second-member notice while the household is loading', async () => {
    useHogar.mockReturnValue({ estado: 'loading' })
    useListas.mockReturnValue(listasBase({ ready: false, loading: true }))
    renderizar()

    await screen.findByRole('status')
    expect(
      screen.queryByText(/todavía no hay nadie más/i),
    ).not.toBeInTheDocument()
  })

  it('a rename ok:false on a populated screen keeps the row list, heading, and form visible', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    const renombrar = vi.fn().mockResolvedValue({
      ok: false,
      error: Object.assign(new Error('no se pudo renombrar'), {
        tipo: 'persistence',
      }),
    })
    useListas.mockReturnValue(
      listasBase({ listas: [lista('a', 'Semanal')], renombrar }),
    )
    const user = usuario()
    renderizar()

    await user.click(await screen.findByRole('button', { name: /renombrar/i }))
    // Two "nombre" inputs exist now: the create form and the row's own edit
    // input. Both persist through the failed rename — the screen never
    // collapses to a single, error-only state.
    const [, entradaFila] = screen.getAllByRole('textbox', { name: /nombre/i })
    await user.clear(entradaFila)
    await user.type(entradaFila, 'Nueva')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByText('no se pudo renombrar')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Listas' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('textbox', { name: /nombre/i })).toHaveLength(2)
  })

  it('deleting the only remaining list transitions the populated state to the empty-lists state', async () => {
    useHogar.mockReturnValue(hogarReady(2))
    const eliminar = vi.fn().mockResolvedValue({ ok: true, valor: undefined })
    useListas.mockReturnValue(
      listasBase({ listas: [lista('a', 'Semanal')], eliminar }),
    )
    const user = usuario()
    const { forzarRerender } = renderizar()

    await user.click(await screen.findByRole('button', { name: /^eliminar$/i }))
    const botones = await screen.findAllByRole('button', {
      name: /^eliminar$/i,
    })
    await user.click(botones[botones.length - 1])
    await vi.waitFor(() => expect(eliminar).toHaveBeenCalledWith('a'))

    // Simulates the live query converging to zero lists after the delete
    // settles — this file mocks the hook, so the transition is driven
    // explicitly rather than by a real collection update.
    useListas.mockReturnValue(listasBase({ listas: [], eliminar }))
    forzarRerender()

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Todavía no tienes listas',
      }),
    ).toBeInTheDocument()
  })
})
