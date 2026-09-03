import { render, screen } from '@testing-library/react'
import { SesionProvider, useSesion } from '@/shared/hogar/sesion-contexto'

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

beforeEach(() => {
  vi.clearAllMocks()
  auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })
  auth.onAuthStateChange.mockReturnValue(vi.fn())
})

function Consumidor() {
  const { loading } = useSesion()
  return <p data-testid="loading">{String(loading)}</p>
}

describe('SesionProvider / useSesion', () => {
  it('provides the session state to a consumer rendered under the provider', () => {
    render(
      <SesionProvider>
        <Consumidor />
      </SesionProvider>,
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
  })

  it('throws when useSesion() is called outside a SesionProvider', () => {
    // Suppress React's expected console.error for the thrown-render case.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumidor />)).toThrow()

    consoleError.mockRestore()
  })

  it('resolves the session exactly once for two consumers sharing one provider', () => {
    render(
      <SesionProvider>
        <Consumidor />
        <Consumidor />
      </SesionProvider>,
    )

    expect(auth.getCurrentUser).toHaveBeenCalledTimes(1)
    expect(auth.onAuthStateChange).toHaveBeenCalledTimes(1)
  })
})
