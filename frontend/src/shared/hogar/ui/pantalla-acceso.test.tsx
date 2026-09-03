import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PantallaAcceso } from '@/shared/hogar/ui/pantalla-acceso'
import type { EstadoSesion } from '@/shared/hogar/use-sesion'

const { useSesionMock } = vi.hoisted(() => ({ useSesionMock: vi.fn() }))
vi.mock('@/shared/hogar/sesion-contexto', () => ({
  useSesion: useSesionMock,
}))

function unEstadoSesion(overrides: Partial<EstadoSesion> = {}): EstadoSesion {
  return {
    user: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  useSesionMock.mockReset()
})

describe('PantallaAcceso — signed out', () => {
  it('renders a sign-in button that calls signIn on click', async () => {
    const signIn = vi.fn()
    useSesionMock.mockReturnValue(unEstadoSesion({ signIn }))
    const user = userEvent.setup()

    render(<PantallaAcceso />)

    const boton = screen.getByRole('button', { name: /sign in with google/i })
    await user.click(boton)

    expect(signIn).toHaveBeenCalledTimes(1)
  })
})

describe('PantallaAcceso — signed in', () => {
  it('renders the user name, avatar and a sign-out control that calls signOut', async () => {
    const signOut = vi.fn()
    useSesionMock.mockReturnValue(
      unEstadoSesion({
        user: {
          id: 'user-1',
          email: 'ana@example.com',
          nombre: 'Ana',
          avatarUrl: 'https://example.com/ana.png',
        },
        signOut,
      }),
    )
    const user = userEvent.setup()

    render(<PantallaAcceso />)

    expect(screen.getByText('Ana')).toBeInTheDocument()
    const boton = screen.getByRole('button', { name: /sign out/i })
    await user.click(boton)

    expect(signOut).toHaveBeenCalledTimes(1)
  })
})

describe('PantallaAcceso — error states', () => {
  it('renders a persistent destructive alert for inicio-fallido', () => {
    useSesionMock.mockReturnValue(unEstadoSesion({ error: 'inicio-fallido' }))

    render(<PantallaAcceso />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not start Google sign-in. Please try again.',
    )
  })

  it('renders a persistent destructive alert for proveedor-rechazo', () => {
    useSesionMock.mockReturnValue(
      unEstadoSesion({ error: 'proveedor-rechazo' }),
    )

    render(<PantallaAcceso />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Google sign-in was cancelled or denied.',
    )
  })

  it('renders a persistent destructive alert for retorno-sin-sesion', () => {
    useSesionMock.mockReturnValue(
      unEstadoSesion({ error: 'retorno-sin-sesion' }),
    )

    render(<PantallaAcceso />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Google sent you back, but the session could not be completed. Your account may not be usable yet.',
    )
  })

  it('renders a persistent destructive alert for cierre-fallido', () => {
    useSesionMock.mockReturnValue(unEstadoSesion({ error: 'cierre-fallido' }))

    render(<PantallaAcceso />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not sign out. Please try again.',
    )
  })
})
