import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

// Row link to the list detail (design D1). It was born as the seam behind a
// `@ts-expect-error` while `/listas/$listaId` did not exist yet (Engram
// #538); task 050 registered the route, so the `to` is now fully typed.
export function EnlaceLista({
  lista,
}: {
  lista: { id: string; nombre: string }
}) {
  return (
    <Link
      to="/listas/$listaId"
      params={{ listaId: lista.id }}
      className={cn(buttonVariants({ variant: 'link' }), 'min-h-11 min-w-11')}
    >
      {lista.nombre}
    </Link>
  )
}
