import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'

// The single place the route tree is assembled. main.tsx consumes this; nothing
// else builds a router, so there is one source of truth for the registered type
// below.
//
// The route files themselves stay in src/routes/ — see section 2.1 of
// docs/03-Arquitectura.md for why.
export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
