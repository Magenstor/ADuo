import { useListas } from '@/modules/listas'
import type { ErrorAplicacion } from '@/modules/listas'
import { useHogar } from '@/shared/hogar/hogar-contexto'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { EstadoCarga } from '@/shared/marco/ui/estado-carga'
import { EstadoVacio } from '@/shared/marco/ui/estado-vacio'
import { AvisoSegundoMiembro } from './aviso-segundo-miembro'
import { CrearLista } from './crear-lista'
import { FilaLista } from './fila-lista'

// Never the raw SDK message (design D5): banner copy is mapped by
// `error.tipo`, one line per non-validation tipo this screen can see.
const COPIA_BANNER: Record<'persistence' | 'query' | 'realtime', string> = {
  persistence: 'No se pudo guardar el cambio. Intenta de nuevo.',
  query: 'No se pudo cargar la información. Intenta de nuevo.',
  realtime: 'No se pudo conectar con tu hogar. Intenta recargar la página.',
}

function copiaBanner(error: ErrorAplicacion | undefined): string | undefined {
  if (!error || error.tipo === 'validation') return undefined
  return COPIA_BANNER[error.tipo]
}

// Container (design's Technical Approach): calls useHogar() and useListas()
// once, resolves the 5-state machine per D10's evaluation order, and passes
// crear/renombrar/eliminar down as props to the presentational components.
export function PantallaListas() {
  const hogar = useHogar()
  const listas = useListas()

  if (hogar.estado === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Listas</h2>
        <Alert variant="destructive">
          <AlertDescription>
            {copiaBanner(listas.error) ?? COPIA_BANNER.realtime}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (hogar.estado === 'sin-hogar') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Listas</h2>
        <EstadoVacio
          titulo="Todavía no formas parte de un hogar"
          descripcion="Sin hogar no se pueden crear listas."
        />
      </div>
    )
  }

  if (hogar.estado === 'loading' || !listas.ready) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Listas</h2>
        <EstadoCarga etiqueta="Cargando listas…" />
      </div>
    )
  }

  // hogar.estado === 'ready' && listas.ready from here on.
  const notice = hogar.miembros.length < 2
  const banner = copiaBanner(listas.error)

  if (listas.listas.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Listas</h2>
        {notice && <AvisoSegundoMiembro />}
        {banner && (
          <Alert variant="destructive">
            <AlertDescription>{banner}</AlertDescription>
          </Alert>
        )}
        <EstadoVacio
          titulo="Todavía no tienes listas"
          descripcion="Crea tu primera lista para compartirla con tu hogar."
        >
          <CrearLista crear={listas.crear} />
        </EstadoVacio>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Listas</h2>
      {notice && <AvisoSegundoMiembro />}
      {banner && (
        <Alert variant="destructive">
          <AlertDescription>{banner}</AlertDescription>
        </Alert>
      )}
      <CrearLista crear={listas.crear} />
      <ul aria-label="Listas de la compra" className="flex flex-col gap-2">
        {listas.listas.map((lista) => (
          <FilaLista
            key={lista.id}
            lista={lista}
            renombrar={listas.renombrar}
            eliminar={listas.eliminar}
          />
        ))}
      </ul>
    </div>
  )
}
