import { render, within } from '@testing-library/react'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { AppProviders } from '@/app/providers/query'
import { getRouter } from '@/app/router'

// Same harness preamble as `rutas-protegidas.test.tsx:1-41` — copied, not
// imported, so a chrome regression here can never fail that file's guard
// regression net (see design's Testing Strategy section).
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

beforeEach(() => {
  vi.clearAllMocks()
  auth.onAuthStateChange.mockReturnValue(vi.fn())
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

function mockUsuarioFirmado() {
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
}

describe('MarcoApp — visitante con sesión', () => {
  // Both the header's brand and (until Phase 4) the routed `AppPlaceholder`
  // render an `<h1>ADuo</h1>`. Scoping to `banner` keeps this assertion
  // meaningful without the D3-flagged multiple-match ambiguity — and it
  // stays valid once Phase 4 swaps the route body for `EstadoVacio`.
  it('renders the banner and main landmarks with the brand heading', async () => {
    mockUsuarioFirmado()

    const { findByRole } = renderizarEn('/')

    const banner = await findByRole('banner')
    expect(
      await within(banner).findByRole('heading', { level: 1, name: 'ADuo' }),
    ).toBeInTheDocument()
    expect(await findByRole('main')).toBeInTheDocument()
  })

  it('marks the "Listas" nav link as the current page at /', async () => {
    mockUsuarioFirmado()

    const { findByRole } = renderizarEn('/')

    const banner = await findByRole('banner')
    const enlace = await within(banner).findByRole('link', { name: 'Listas' })
    expect(enlace).toHaveAttribute('aria-current', 'page')
  })

  // Structural only (see identidad-usuario.test.tsx) — proves the nav link
  // carries the 44px touch-target utility classes, not that it renders at
  // 44px. Real verification is visual, at 375px width in `pnpm dev`.
  it('sizes the "Listas" nav link to at least a 44px touch target (structural)', async () => {
    mockUsuarioFirmado()

    const { findByRole } = renderizarEn('/')

    const banner = await findByRole('banner')
    const enlace = await within(banner).findByRole('link', { name: 'Listas' })
    expect(enlace.className).toMatch(/\bmin-h-11\b/)
    expect(enlace.className).toMatch(/\bmin-w-11\b/)
  })

  // Proves the routed screen mounts inside <main> without depending on its
  // exact markup — this same case is re-verified after Phase 4 replaces the
  // placeholder body with `EstadoVacio`, so it must hold for either content.
  it('renders exactly one heading for the routed content inside <main>', async () => {
    mockUsuarioFirmado()

    const { findByRole } = renderizarEn('/')

    const main = await findByRole('main')
    expect(await within(main).findAllByRole('heading')).toHaveLength(1)
  })

  // C1 (verify report #446): composition-scoped — proves the header
  // actually renders `IdentidadUsuario`, not just that the component works
  // in isolation (`identidad-usuario.test.tsx` mocks `useSesion` wholesale).
  it("resolves the signed-in user's identity and a reachable sign-out control inside the banner", async () => {
    mockUsuarioFirmado()

    const { findByRole } = renderizarEn('/')

    const banner = await findByRole('banner')
    expect(await within(banner).findByText('Ana')).toBeInTheDocument()
    expect(
      await within(banner).findByRole('button', { name: /sign out/i }),
    ).toBeEnabled()
  })

  // C2 (verify report #446, amended by ui-listas Group A — Engram #546):
  // originally pinned the placeholder `EstadoVacio` copy. Under this file's
  // `auth`-only mock (no household mock registered here), `useHogar()`
  // resolves `error` once the real `PantallaListas` is wired in, so the
  // screen correctly renders the household-error banner (state 3) — not
  // the old placeholder, and not the two-heading empty-list state (that
  // shape is covered by `pantalla-listas.test.tsx`'s mocked-hooks suite).
  it('renders a household-error banner inside <main>, with a single heading and no list markup', async () => {
    mockUsuarioFirmado()

    const { findByRole } = renderizarEn('/')

    const main = await findByRole('main')
    expect(await within(main).findByRole('alert')).toBeInTheDocument()
    expect(await within(main).findAllByRole('heading')).toHaveLength(1)
    expect(within(main).queryAllByRole('listitem')).toHaveLength(0)
  })
})

describe('MarcoApp — visitante sin sesión', () => {
  it('never renders the banner at /entrar', async () => {
    auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })

    const { findByRole, queryByRole } = renderizarEn('/entrar')

    await findByRole('button', { name: /sign in with google/i })
    expect(queryByRole('banner')).not.toBeInTheDocument()
  })
})
