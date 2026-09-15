import type { ReactNode } from 'react'
import { render, within } from '@testing-library/react'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { AppProviders } from '@/app/providers/query'
import { getRouter } from '@/app/router'

// Same `@/shared/api/insforge` mock boundary as `rutas-protegidas.test.tsx`
// and `marco-app.test.tsx` — the real app router/provider stack, exercised
// through an in-memory history.
const { auth } = vi.hoisted(() => ({
  auth: {
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(() => () => {}),
  },
}))
vi.mock('@/shared/api/insforge', () => ({ insforge: { auth } }))

vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))
vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtoolsPanel: () => null,
}))

// Household resolution: real `HogarProvider`, mocked repository call —
// ready with one member, so the screen is past its loading/sin-hogar/error
// branches.
const { resolverHogar } = vi.hoisted(() => ({ resolverHogar: vi.fn() }))
vi.mock('@/shared/hogar/hogar-repository', () => ({ resolverHogar }))

// The real household resource boundary (`HogarListas`) does live DB/realtime
// setup this test has no server for — passthrough per the design's
// Testing Strategy "Integration" row.
vi.mock('@/modules/listas/application/hogar-listas', () => ({
  HogarListas: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// The public barrel: this integration test proves the route renders
// `PantallaListas` for real, not that the application hooks work (those
// have their own suites) — so the hooks themselves are mocked here too.
const { useListas, useArticulos } = vi.hoisted(() => ({
  useListas: vi.fn(),
  useArticulos: vi.fn(),
}))
vi.mock('@/modules/listas', () => ({ useListas, useArticulos }))

beforeEach(() => {
  vi.clearAllMocks()
  auth.onAuthStateChange.mockReturnValue(vi.fn())
  auth.getCurrentUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-1',
        email: 'ana@example.com',
        emailVerified: true,
        createdAt: '2026-08-25T00:00:00.000Z',
        updatedAt: '2026-08-25T00:00:00.000Z',
        metadata: null,
        profile: { name: 'Ana', avatar_url: null },
      },
    },
    error: null,
  })
  resolverHogar.mockResolvedValue({
    estado: 'ready',
    hogar: { id: 'hogar-1', nombre: 'Casa' },
    miembros: [
      { id: 'm-1', householdId: 'hogar-1', userId: 'user-1', nombre: 'Ana' },
    ],
  })
  useArticulos.mockReturnValue({ ready: true, articulos: [] })
  useListas.mockReturnValue({
    listas: [
      {
        id: 'lista-1',
        householdId: 'hogar-1',
        nombre: 'Semanal',
        createdAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'u-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
        updatedBy: 'u-1',
      },
    ],
    loading: false,
    ready: true,
    error: undefined,
    crear: vi.fn(),
    renombrar: vi.fn(),
    eliminar: vi.fn(),
  })
})

function renderizarEn(ruta: string) {
  const router = getRouter(createMemoryHistory({ initialEntries: [ruta] }))
  const utils = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { router, ...utils }
}

describe('pantalla-listas — integración de ruta', () => {
  it('renders the screen inside <main> with a populated list and a row link to its detail route', async () => {
    const { findByRole } = renderizarEn('/')

    const main = await findByRole('main')
    const enlace = await within(main).findByRole('link', { name: 'Semanal' })
    expect(enlace).toHaveAttribute('href', '/listas/lista-1')
  })
})
