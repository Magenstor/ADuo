import { createFileRoute } from '@tanstack/react-router'
import { PantallaListas } from '@/modules/listas/ui/listas/pantalla-listas'

// Thin route (design D1): registers the screen container by its deep path,
// not the shared barrel (which Group B's detail route also consumes). No
// `<h1>` of its own: `MarcoApp` already owns the page's one `<h1>`;
// `PantallaListas` renders its own `<h2>Listas</h2>`.
export const Route = createFileRoute('/_privado/')({
  component: PantallaListas,
})
