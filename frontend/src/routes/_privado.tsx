import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { useSesion } from '@/shared/hogar/sesion-contexto'

// Pathless layout guard: every route nested under `_privado` renders only
// for a signed-in visitor. No `loading` check here — `SesionResuelta`
// (mounted above `<Outlet/>` in `__root.tsx`) guarantees the session has
// resolved at least once by the time this component mounts, so `user ===
// null` here always means "genuinely signed out", never "still loading".
export const Route = createFileRoute('/_privado')({
  component: PrivadoComponent,
})

function PrivadoComponent() {
  const { user } = useSesion()

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
