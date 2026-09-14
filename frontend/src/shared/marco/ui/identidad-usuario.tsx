import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { useSesion } from '@/shared/hogar/sesion-contexto'

// Header identity + sign-out, reusing the exact `Avatar` + `Button
// variant="outline"` shape already at `pantalla-acceso.tsx:34-46` — see
// design D2/D5. Reads `useSesion()` itself so `MarcoApp` stays prop-free.
//
// `user === null` is structurally unreachable under `_privado` (the guard in
// `routes/_privado.tsx` already redirected). This branch exists only to
// narrow `Usuario | null` (`shared/hogar/sesion.ts:6`).
export function IdentidadUsuario() {
  const { user, signOut } = useSesion()

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarImage
          src={user.avatarUrl ?? undefined}
          alt={user.nombre ?? user.email}
        />
        <AvatarFallback>
          {(user.nombre ?? user.email).slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-28 truncate font-medium sm:max-w-none">
        {user.nombre ?? user.email}
      </span>
      {/* min-h-11 min-w-11 tops up the shared `sm` Button (h-8 = 32px) up to
          the 44px touch-target minimum — see navegacion-app.tsx for why the
          shared default itself is left untouched. */}
      <Button
        variant="outline"
        size="sm"
        className="min-h-11 min-w-11"
        onClick={() => signOut()}
      >
        Sign out
      </Button>
    </div>
  )
}
