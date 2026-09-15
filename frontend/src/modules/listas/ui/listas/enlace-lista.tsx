import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

// Seam component (design D1, Engram #538): the app's registered router has
// no `/listas/$listaId` route yet — task 050 (Group B) adds it on an
// independent branch. This is the ONE place the typed `to` is not yet
// resolvable, isolated behind a single `@ts-expect-error` directive so the
// rest of the module stays fully typed. Once Group B merges, the same
// `tsc --noEmit` run reports an unused-directive error here and the second
// merger deletes this one line (Engram #538).
export function EnlaceLista({
  lista,
}: {
  lista: { id: string; nombre: string }
}) {
  // Spread first so a single directive anchors the one diagnostic the
  // as-const literal still produces (design Interfaces note): `to` and
  // `params` split onto two lines under Prettier, and each fails its own
  // check individually when passed as separate JSX attributes.
  const destino = {
    to: '/listas/$listaId',
    params: { listaId: lista.id },
  } as const
  return (
    // @ts-expect-error — `/listas/$listaId` is registered by task 050 (Group B)
    <Link
      {...destino}
      className={cn(buttonVariants({ variant: 'link' }), 'min-h-11')}
    >
      {lista.nombre}
    </Link>
  )
}
