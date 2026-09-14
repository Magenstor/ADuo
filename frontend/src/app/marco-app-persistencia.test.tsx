import { render, within } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { AppProviders } from '@/app/providers/query'
import { MarcoApp } from '@/shared/marco/ui/marco-app'

// Same `@/shared/api/insforge` mock boundary as `rutas-protegidas.test.tsx`.
// `MarcoApp` renders `IdentidadUsuario`, which calls `useSesion()` — that
// throws without a mounted `<SesionProvider>`, so `AppProviders` (which
// mounts it) is required here even though this test's own route tree is
// hand-built.
const { auth } = vi.hoisted(() => ({
  auth: {
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(() => () => {}),
  },
}))
vi.mock('@/shared/api/insforge', () => ({ insforge: { auth } }))

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
})

// Hand-built route tree instead of the real one: the real `/_privado` tree
// has no second authenticated destination yet (task 049 adds it), so this
// mirrors its exact shape — a pathless layout mounting `MarcoApp` once
// around `<Outlet/>`, with two leaf routes nested under it — to prove the
// frame itself does not remount, without waiting on that future route.
describe('MarcoApp — persistence across in-app navigation', () => {
  it('keeps the same header DOM node across a navigation between two nested routes', async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> })
    const marcoRoute = createRoute({
      id: '_marco',
      getParentRoute: () => rootRoute,
      component: () => (
        <MarcoApp>
          <Outlet />
        </MarcoApp>
      ),
    })
    const rutaUno = createRoute({
      path: '/uno',
      getParentRoute: () => marcoRoute,
      component: () => <h2>Uno</h2>,
    })
    const rutaDos = createRoute({
      path: '/dos',
      getParentRoute: () => marcoRoute,
      component: () => <h2>Dos</h2>,
    })
    const routeTree = rootRoute.addChildren([
      marcoRoute.addChildren([rutaUno, rutaDos]),
    ])
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/uno'] }),
    })

    const { findByRole } = render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )

    const bannerInicial = await findByRole('banner')
    await findByRole('heading', { level: 2, name: 'Uno' })

    // The hand-built route is intentionally absent from the app's global
    // TanStack router registration. Keep this assertion test-local while
    // deriving the target from the route under test rather than weakening app types.
    await router.navigate({ to: rutaDos.fullPath as never })

    // W1 (verify report #446): the prior assertion alone passed even when
    // `router.navigate` was never called, and even when `_privado.tsx` was
    // reverted to a bare `<Outlet/>` — it never proved a navigation
    // happened. Pin the pathname and the routed content swap alongside the
    // banner-node identity check below.
    expect(router.state.location.pathname).toBe('/dos')
    const main = await findByRole('main')
    expect(
      await within(main).findByRole('heading', { name: 'Dos' }),
    ).toBeInTheDocument()
    expect(within(main).queryByText('Uno')).not.toBeInTheDocument()

    const bannerFinal = await findByRole('banner')
    expect(bannerFinal).toBe(bannerInicial)
  })
})
