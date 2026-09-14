import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IdentidadUsuario } from './identidad-usuario'
import { useSesion } from '@/shared/hogar/sesion-contexto'

// Plain RTL — no router, no `AppProviders`. `useSesion` is mocked at the same
// boundary `pantalla-acceso.test.tsx` uses, so this file never depends on a
// real `<SesionProvider>` mount.
vi.mock('@/shared/hogar/sesion-contexto', () => ({ useSesion: vi.fn() }))

const useSesionMock = vi.mocked(useSesion)

function usuarioSesion({ nombre = 'Ana' }: { nombre?: string | null } = {}) {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    nombre,
    avatarUrl: null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('IdentidadUsuario', () => {
  it("shows the user's name when present", () => {
    useSesionMock.mockReturnValue({
      user: usuarioSesion(),
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    const { getByText } = render(<IdentidadUsuario />)

    expect(getByText('Ana')).toBeInTheDocument()
  })

  it('falls back to the email when `nombre` is null', () => {
    useSesionMock.mockReturnValue({
      user: usuarioSesion({ nombre: null }),
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    const { getByText } = render(<IdentidadUsuario />)

    expect(getByText('ana@example.com')).toBeInTheDocument()
  })

  it('calls `signOut` once when the sign-out control is clicked', async () => {
    const signOut = vi.fn()
    useSesionMock.mockReturnValue({
      user: usuarioSesion(),
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut,
    })
    const user = userEvent.setup()

    const { getByRole } = render(<IdentidadUsuario />)
    await user.click(getByRole('button', { name: /sign out/i }))

    expect(signOut).toHaveBeenCalledTimes(1)
  })

  // Structural only — jsdom has no layout engine, so this cannot prove the
  // rendered box is actually 44px. It proves the sign-out control carries
  // the utility classes that produce that minimum (`min-h-11`/`min-w-11` =
  // 2.75rem = 44px in Tailwind's default scale). Real verification is
  // visual, at 375px width in `pnpm dev`.
  it('sizes the sign-out control to at least a 44px touch target (structural)', () => {
    useSesionMock.mockReturnValue({
      user: usuarioSesion(),
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    const { getByRole } = render(<IdentidadUsuario />)
    const boton = getByRole('button', { name: /sign out/i })

    expect(boton.className).toMatch(/\bmin-h-11\b/)
    expect(boton.className).toMatch(/\bmin-w-11\b/)
  })

  it('renders nothing when `user` is null', () => {
    useSesionMock.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    const { container } = render(<IdentidadUsuario />)

    expect(container).toBeEmptyDOMElement()
  })
})
