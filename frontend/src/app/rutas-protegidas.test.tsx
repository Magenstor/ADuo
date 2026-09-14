import { render, within } from '@testing-library/react'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { AppProviders } from '@/app/providers/query'
import { getRouter } from '@/app/router'

// Same template as `use-sesion.test.ts`: mock our own `@/shared/api/insforge`
// boundary, never the vendor SDK.
const { auth } = vi.hoisted(() => ({
  auth: {
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(() => () => {}),
  },
}))
vi.mock('@/shared/api/insforge', () => ({ insforge: { auth } }))

// Devtools are mocked to `null` so an unrelated jsdom failure in either
// devtools package can never take routing tests down — see design Decision 5
// and the "Route-tree test mechanism" section.
vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))
vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtoolsPanel: () => null,
}))

beforeEach(() => {
  vi.clearAllMocks()
  auth.onAuthStateChange.mockReturnValue(vi.fn())
})

// Renders the REAL app router/provider stack at a given starting URL, using
// an in-memory history so no real browser navigation is needed.
function renderizarEn(ruta: string) {
  const router = getRouter(createMemoryHistory({ initialEntries: [ruta] }))
  const utils = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { router, ...utils }
}

describe('rutas protegidas — visitante sin sesión', () => {
  it('redirects / to /entrar and renders the sign-in screen', async () => {
    auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })

    const { router, findByRole } = renderizarEn('/')

    expect(
      await findByRole('button', { name: /sign in with google/i }),
    ).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe('/entrar'),
    )

    // Proves the guard redirected with `replace`, not `push`. The memory
    // history starts with a single `/` entry: a push would leave `/`
    // behind it and make the back button bounce straight into the guard.
    expect(router.history.canGoBack()).toBe(false)
  })
})

describe('rutas protegidas — visitante con sesión', () => {
  it('renders the / empty state and does not redirect', async () => {
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

    const { router, findByRole } = renderizarEn('/')

    const main = await findByRole('main')
    expect(await within(main).findByRole('heading')).toBeInTheDocument()
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})

describe('rutas protegidas — anti-flash mientras la sesión no ha resuelto', () => {
  it('shows only the status placeholder at /entrar while getCurrentUser never resolves', async () => {
    auth.getCurrentUser.mockImplementation(() => new Promise(() => {}))

    const { findByRole, queryByRole } = renderizarEn('/entrar')

    expect(await findByRole('status')).toBeInTheDocument()
    expect(
      queryByRole('button', { name: /sign in with google/i }),
    ).not.toBeInTheDocument()
  })

  it('shows only the status placeholder at /, without an early redirect, until the session resolves', async () => {
    let resolverSesion: (value: {
      data: { user: unknown }
      error: null
    }) => void = () => {}
    auth.getCurrentUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverSesion = resolve
        }),
    )

    const { router, findByRole, queryByRole } = renderizarEn('/')

    expect(await findByRole('status')).toBeInTheDocument()
    expect(
      queryByRole('button', { name: /sign in with google/i }),
    ).not.toBeInTheDocument()
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'))

    resolverSesion({
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

    // `/entrar` and `/` both render an `<h1>ADuo</h1>`, so the heading alone
    // proves nothing. The absent sign-in button plus the pathname are what
    // distinguish "the guard let us through" from "the guard redirected".
    //
    // Scoped to `main`: the frame mounted around `<Outlet/>` (task 039) adds
    // its own `<h1>` in the header, so an unscoped `findByRole('heading')`
    // now matches two elements.
    const main = await findByRole('main')
    expect(await within(main).findByRole('heading')).toBeInTheDocument()
    expect(
      queryByRole('button', { name: /sign in with google/i }),
    ).not.toBeInTheDocument()
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})
