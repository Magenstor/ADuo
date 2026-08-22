import { renderHook, waitFor } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { AppProviders } from '@/app/providers/query'

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
