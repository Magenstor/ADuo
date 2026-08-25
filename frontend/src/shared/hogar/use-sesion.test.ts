import { act, renderHook, waitFor } from '@testing-library/react'
import type { UserSchema } from '@insforge/shared-schemas'
import { useSesion } from '@/shared/hogar/use-sesion'

// This is the repo's first `vi.mock`. It mocks our own `@/shared/api/insforge`
// boundary rather than the vendor `@insforge/sdk` package: `insforge.ts`
// throws at module scope when env vars are missing, and a real `createClient`
// would run `detectAuthCallback()` and hit the network under jsdom. This
// template becomes the convention for later `infrastructure/` test files.
const { auth } = vi.hoisted(() => ({
  auth: {
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(() => () => {}),
  },
}))
vi.mock('@/shared/api/insforge', () => ({ insforge: { auth } }))

// The hook must read the OAuth-return flags from the module-level capture,
// never from `window.location.search` directly (params are already stripped
// by the time the hook runs). Mocking this module lets each test control
// those flags independently.
const { retornoOAuthMock } = vi.hoisted(() => ({
  retornoOAuthMock: { traiaCodigo: false, errorDelProveedor: false },
}))
vi.mock('@/shared/hogar/retorno-oauth', () => ({
  get retornoOAuth() {
    return retornoOAuthMock
  },
}))

function unUserSchema(overrides: Partial<UserSchema> = {}): UserSchema {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    emailVerified: true,
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
    metadata: null,
    profile: { name: 'Ana', avatar_url: 'https://example.com/ana.png' },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.onAuthStateChange.mockReturnValue(vi.fn())
  retornoOAuthMock.traiaCodigo = false
  retornoOAuthMock.errorDelProveedor = false
})

describe('useSesion — initial load with no pending OAuth code', () => {
  it('resolves to a plain signed-out state', async () => {
    auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })

    const { result } = renderHook(() => useSesion())

    await waitFor(() => expect(result.current.loading).toBe(false))

    // `toEqual`, not `toMatchObject`: this pins the Session Hook Contract's
    // exact key set (`{ user, loading, error, signIn, signOut }`), so an
    // accidental extra or renamed key is caught — `toMatchObject` would miss it.
    expect(result.current).toEqual({
      user: null,
      loading: false,
      error: null,
      signIn: expect.any(Function),
      signOut: expect.any(Function),
    })
  })

  it('discards a refreshSession error surfaced through getCurrentUser', async () => {
    auth.getCurrentUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No active session', statusCode: 401 },
    })

    const { result } = renderHook(() => useSesion())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current).toEqual({
      user: null,
      loading: false,
      error: null,
      signIn: expect.any(Function),
      signOut: expect.any(Function),
    })
  })
})

describe('useSesion — signed-in mount', () => {
  it('exposes the mapped Usuario once getCurrentUser resolves a user', async () => {
    auth.getCurrentUser.mockResolvedValue({
      data: { user: unUserSchema() },
      error: null,
    })

    const { result } = renderHook(() => useSesion())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      nombre: 'Ana',
      avatarUrl: 'https://example.com/ana.png',
    })
    expect(result.current.error).toBeNull()
  })
})

describe('useSesion — loud failure on OAuth return with no session', () => {
  it('sets error to retorno-sin-sesion when the URL carried insforge_code and no user comes back', async () => {
    retornoOAuthMock.traiaCodigo = true
    auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })

    const { result } = renderHook(() => useSesion())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('retorno-sin-sesion')
    expect(result.current.user).toBeNull()
  })
})

describe('useSesion — provider denied the request', () => {
  it('sets error to proveedor-rechazo when the URL carried an error param', async () => {
    retornoOAuthMock.errorDelProveedor = true
    auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })

    const { result } = renderHook(() => useSesion())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('proveedor-rechazo')
    expect(result.current.user).toBeNull()
  })
})

describe('useSesion — signIn', () => {
  it('calls signInWithOAuth with google and the app-root redirectTo', async () => {
    auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })
    auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

    const { result } = renderHook(() => useSesion())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.signIn()
    })

    expect(auth.signInWithOAuth).toHaveBeenCalledTimes(1)
    expect(auth.signInWithOAuth).toHaveBeenCalledWith('google', {
      redirectTo: 'http://localhost:3000/',
    })
  })

  it('sets error to inicio-fallido and clears loading when signInWithOAuth fails', async () => {
    auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })
    auth.signInWithOAuth.mockResolvedValue({
      data: {},
      error: { message: 'oauth denied', statusCode: 400 },
    })

    const { result } = renderHook(() => useSesion())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      result.current.signIn()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('inicio-fallido')
  })
})

describe('useSesion — signOut', () => {
  it('clears the user on a successful sign-out', async () => {
    auth.getCurrentUser.mockResolvedValue({
      data: { user: unUserSchema() },
      error: null,
    })
    auth.signOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useSesion())
    await waitFor(() => expect(result.current.user).not.toBeNull())

    await act(async () => {
      result.current.signOut()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('keeps the user signed in and surfaces cierre-fallido when signOut fails', async () => {
    auth.getCurrentUser.mockResolvedValue({
      data: { user: unUserSchema() },
      error: null,
    })
    auth.signOut.mockResolvedValue({
      error: { message: 'network error', statusCode: 500 },
    })

    const { result } = renderHook(() => useSesion())
    await waitFor(() => expect(result.current.user).not.toBeNull())

    await act(async () => {
      result.current.signOut()
    })

    expect(result.current.user).not.toBeNull()
    expect(result.current.error).toBe('cierre-fallido')
  })
})

describe('useSesion — onAuthStateChange event handling', () => {
  it('does not resurrect retorno-sin-sesion after a real sign-out that follows an OAuth return', async () => {
    // Reproduces the exact race from a Google OAuth return followed by an
    // immediate sign-out in the same page load: `traiaCodigo` stays `true`
    // for the page's lifetime, and the SDK's `clearSession()` emits
    // `signedOut` synchronously from inside `signOut()`, before the SDK
    // promise itself resolves. `getCurrentUser` must be genuinely deferred
    // here — an instantly-resolving mock inverts that ordering and hides
    // the bug.
    retornoOAuthMock.traiaCodigo = true

    let authChangeCallback: (event: string) => void = () => {}
    auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback
      return vi.fn()
    })

    // Call-counting implementation rather than a queued `mockResolvedValueOnce`
    // chain: a correct fix never issues a second `getCurrentUser()` call for
    // `signedOut`, and a queued deferred value that no call ever consumes
    // would leak, unresolved, into the next test.
    let getCurrentUserCallCount = 0
    let resolveSecondCall: (value: {
      data: { user: UserSchema | null }
      error: null
    }) => void = () => {}
    auth.getCurrentUser.mockImplementation(() => {
      getCurrentUserCallCount += 1
      if (getCurrentUserCallCount === 1) {
        return Promise.resolve({ data: { user: unUserSchema() }, error: null })
      }
      // Only a regressed implementation reaches a second call. Defer it to
      // model real network latency — the exact ordering an instant mock
      // would hide.
      return new Promise((resolve) => {
        resolveSecondCall = resolve
      })
    })

    // `signOut()` mirrors the real SDK: the `signedOut` event fires
    // synchronously, from inside the call, before the returned promise
    // settles.
    auth.signOut.mockImplementation(() => {
      authChangeCallback('signedOut')
      return Promise.resolve({ error: null })
    })

    const { result } = renderHook(() => useSesion())
    await waitFor(() => expect(result.current.user).not.toBeNull())

    await act(async () => {
      result.current.signOut()
      await Promise.resolve()
    })

    // The local signOut() promise settled first.
    expect(result.current.user).toBeNull()
    expect(result.current.error).toBeNull()

    // A correct implementation never re-reads getCurrentUser() on signedOut.
    expect(getCurrentUserCallCount).toBe(1)

    // Defensive: if a regression reintroduces the re-read, prove that even
    // once it resolves with no session, the stale traiaCodigo flag must not
    // resurrect the loud-failure error.
    if (getCurrentUserCallCount > 1) {
      await act(async () => {
        resolveSecondCall({ data: { user: null }, error: null })
      })
      expect(result.current.error).toBeNull()
    }
  })

  it('re-reads the current user on a signedIn or tokenRefreshed event', async () => {
    let authChangeCallback: (event: string) => void = () => {}
    auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback
      return vi.fn()
    })

    auth.getCurrentUser
      .mockResolvedValueOnce({ data: { user: null }, error: null })
      .mockResolvedValueOnce({ data: { user: unUserSchema() }, error: null })

    const { result } = renderHook(() => useSesion())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()

    await act(async () => {
      authChangeCallback('signedIn')
    })

    await waitFor(() => expect(result.current.user).not.toBeNull())
    expect(result.current.user).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      nombre: 'Ana',
      avatarUrl: 'https://example.com/ana.png',
    })
  })
})

describe('useSesion — unmount safety', () => {
  it('unsubscribes from auth state changes on unmount and tolerates a late getCurrentUser resolution', async () => {
    const unsubscribe = vi.fn()
    auth.onAuthStateChange.mockReturnValue(unsubscribe)
    let resolveGetCurrentUser: (value: {
      data: { user: UserSchema | null }
      error: null
    }) => void = () => {}
    auth.getCurrentUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGetCurrentUser = resolve
        }),
    )

    const { unmount } = renderHook(() => useSesion())

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(() =>
      resolveGetCurrentUser({ data: { user: null }, error: null }),
    ).not.toThrow()
    await Promise.resolve()
  })
})
