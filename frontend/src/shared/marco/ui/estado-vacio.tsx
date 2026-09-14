import type { ReactNode } from 'react'

// Shared empty state, per design D6. `children` is the action slot: task
// 049's "no lists yet" case needs an inline create-list form, not a button,
// so `ReactNode` accepts either without forcing a rewrite later.
//
// Deliberately no `role="status"`: this is not a live update, and announcing
// it on every route change would be noise for screen-reader users.
export function EstadoVacio({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <h2 className="text-xl font-semibold">{titulo}</h2>
      {descripcion && <p className="text-muted-foreground">{descripcion}</p>}
      {children}
    </div>
  )
}
