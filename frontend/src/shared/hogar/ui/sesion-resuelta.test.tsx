import { render, screen } from '@testing-library/react'
import { SesionResuelta } from '@/shared/hogar/ui/sesion-resuelta'
import type { EstadoSesion } from '@/shared/hogar/use-sesion'

const { useSesionMock } = vi.hoisted(() => ({ useSesionMock: vi.fn() }))
vi.mock('@/shared/hogar/sesion-contexto', () => ({
  useSesion: useSesionMock,
}))

function unEstadoSesion(overrides: Partial<EstadoSesion> = {}): EstadoSesion {
  return {
    user: null,
    loading: true,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  useSesionMock.mockReset()
})

describe('SesionResuelta', () => {
  it('shows the status placeholder and withholds children while loading', () => {
    useSesionMock.mockReturnValue(unEstadoSesion({ loading: true }))

    render(
      <SesionResuelta>
        <p>contenido</p>
      </SesionResuelta>,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('contenido')).not.toBeInTheDocument()
  })

  it('renders children once loading is false', () => {
    useSesionMock.mockReturnValue(unEstadoSesion({ loading: false }))

    render(
      <SesionResuelta>
        <p>contenido</p>
      </SesionResuelta>,
    )

    expect(screen.getByText('contenido')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps children rendered when loading flips back to true after the first resolution (signIn)', () => {
    useSesionMock.mockReturnValue(unEstadoSesion({ loading: false }))

    const { rerender } = render(
      <SesionResuelta>
        <p>contenido</p>
      </SesionResuelta>,
    )

    expect(screen.getByText('contenido')).toBeInTheDocument()

    // Simulates `signIn()` setting `loading` back to `true` — the latch must
    // NOT re-show the status placeholder or unmount the already-resolved
    // content once it has resolved once.
    useSesionMock.mockReturnValue(unEstadoSesion({ loading: true }))
    rerender(
      <SesionResuelta>
        <p>contenido</p>
      </SesionResuelta>,
    )

    expect(screen.getByText('contenido')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
