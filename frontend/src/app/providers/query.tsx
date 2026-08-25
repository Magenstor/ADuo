import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// One QueryClient for the whole application. Creating it outside the component
// matters: built inside, every re-render would produce a new client and throw
// the cache away on each one.
export const queryClient = new QueryClient()

// Deliberately left with the library defaults. staleTime in particular is a
// decision that belongs to task 044, where the collections live: set too high
// it hides real changes, and a refetch landing on top of a realtime direct
// write is what makes deleted items reappear (section 2.5 of
// docs/02-Decisiones-tecnicas-stack.md).

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
