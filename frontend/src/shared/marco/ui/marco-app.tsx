import type { ReactNode } from 'react'
import { NavegacionApp } from '@/shared/marco/ui/navegacion-app'
import { IdentidadUsuario } from '@/shared/marco/ui/identidad-usuario'

// The frame for the authenticated zone: header (brand + nav + identity) then
// the routed screen inside <main>. Composed below `_privado.tsx`'s `!user`
// guard, so it can never render for a signed-out visitor (design D2).
//
// The single `<h1>ADuo</h1>` here is the brand — plain text, not a link
// (design D3), so it never collides with the nav's `aria-current` link.
// Screens registered under `_privado` use `<h2>` and below.
export function MarcoApp({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Mobile-first: base classes wrap at 320px so the identity cluster
          (which can carry a long email) drops to its own line instead of
          overflowing; sm: restores the single desktop row. */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:flex-nowrap sm:gap-4">
        <h1 className="text-xl font-bold">ADuo</h1>
        <NavegacionApp />
        <IdentidadUsuario />
      </header>
      <main>{children}</main>
    </>
  )
}
