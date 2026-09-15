import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useArticulos } from '@/modules/listas'
import type { Resultado } from '@/modules/listas'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import type { Lista } from '../../domain/lista'
import { copiaErrorLista } from './copia-error'
import { usePendiente } from './pendiente'

function textoConteo(ready: boolean, cantidad: number): string {
  if (!ready) return 'Contando artículos…'
  if (cantidad === 0) return 'Esta lista no tiene artículos.'
  if (cantidad === 1) return 'Se perderá 1 artículo.'
  return `Se perderán ${cantidad} artículos.`
}

// Rendered only as a child of `AlertDialogContent` (design D2): mounts
// `useArticulos(lista.id)` for the duration the dialog is open, so this is
// the only live query for the confirmation count. Always calls
// `event.preventDefault()` on confirm so Radix never auto-closes the
// dialog — this component decides when to close, via `alCerrar()`, only on
// a successful delete (design D8).
export function ContenidoEliminarLista({
  lista,
  eliminar,
  alCerrar,
}: {
  lista: Lista
  eliminar: (id: string) => Promise<Resultado<void>>
  alCerrar: () => void
}) {
  const articulos = useArticulos(lista.id)
  const { pendiente, ejecutar } = usePendiente()
  const [error, setError] = useState<string>()

  async function confirmar(evento: MouseEvent) {
    evento.preventDefault()
    const resultado = await ejecutar(() => eliminar(lista.id))
    if (resultado.ok) {
      alCerrar()
      return
    }
    setError(copiaErrorLista(resultado.error))
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Eliminar &quot;{lista.nombre}&quot;</AlertDialogTitle>
        <AlertDialogDescription asChild>
          {articulos.ready ? (
            <span>{textoConteo(true, articulos.articulos.length)}</span>
          ) : (
            <span role="status">{textoConteo(false, 0)}</span>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel onClick={alCerrar} className="min-h-11 min-w-11">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={confirmar}
          disabled={!articulos.ready || pendiente}
          className="min-h-11 min-w-11"
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
