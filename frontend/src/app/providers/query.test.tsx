import { renderHook, waitFor } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { AppProviders } from '@/app/providers/query'

// `AppProviders` now composes `<SesionProvider>`, which transitively imports
// `shared/api/insforge.ts` — that module throws at module scope when
// `VITE_INSFORGE_URL`/`VITE_INSFORGE_ANON_KEY` are missing, and a real
// `createClient` would run `detectAuthCallback()` under jsdom. Same template
// as `use-sesion.test.ts`.
vi.mock('@/shared/api/insforge', () => ({
  insforge: {
    auth: {
      // Resolved (not left bare): `SesionProvider` calls this on mount, and
      // an unresolved `vi.fn()` here would reject `await`'s destructuring
      // with an unhandled rejection that has nothing to do with these tests.
      getCurrentUser: vi
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => () => {}),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

describe('AppProviders', () => {
  it('resolves a trivial query', async () => {
    const { result } = renderHook(
      () => useQuery({ queryKey: ['prueba'], queryFn: () => 'hola' }),
      { wrapper: AppProviders },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toBe('hola')
  })

  it('fails the query when the queryFn throws', async () => {
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['rota'],
          queryFn: () => {
            throw new Error('boom')
          },
          retry: false,
        }),
      { wrapper: AppProviders },
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
