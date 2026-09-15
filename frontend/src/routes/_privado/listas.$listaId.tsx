import { createFileRoute } from '@tanstack/react-router'
import { ListaDetallePage } from '@/modules/listas/ui/detalle'

export const Route = createFileRoute('/_privado/listas/$listaId')({
  component: ListaDetalleRoute,
})

function ListaDetalleRoute() {
  const { listaId } = Route.useParams()
  return <ListaDetallePage listaId={listaId} />
}
