import { createFileRoute } from '@tanstack/react-router'
import { EstadoVacio } from '@/shared/marco/ui/estado-vacio'

// Shows the shared empty state instead of a list — the real list index is
// task 049, its detail screen is task 050. No `<h1>` of its own: `MarcoApp`
// already owns the page's one `<h1>` (design D3/D7); `EstadoVacio` renders
// an `<h2>`.
export const Route = createFileRoute('/_privado/')({
  component: AppScreen,
})

function AppScreen() {
  return (
    <EstadoVacio
      titulo="Todavía no tienes listas"
      descripcion="Crea tu primera lista para compartirla con tu hogar."
    />
  )
}
