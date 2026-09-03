import { Outlet, createRootRoute } from '@tanstack/react-router'

import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { SesionResuelta } from '@/shared/hogar/ui/sesion-resuelta'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      {/* Gated so no route content — signed-in or signed-out — renders
          before the session has resolved once. Devtools stay outside: they
          must always mount regardless of session state. */}
      <SesionResuelta>
        <Outlet />
      </SesionResuelta>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}
