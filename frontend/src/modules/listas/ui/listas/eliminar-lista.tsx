import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import type { Resultado } from '@/modules/listas'
import { ContenidoEliminarLista } from './contenido-eliminar-lista'
import type { Lista } from '../../domain/lista'

// Trigger plus the controlled `open` state (design D8). `ContenidoEliminarLista`
// only mounts while `AlertDialogContent` is rendered — Radix's own
// open-gated mounting — so `useArticulos(lista.id)` only runs during
// confirmation, matching design D2.
export function EliminarLista({
  lista,
  eliminar,
}: {
  lista: Lista
  eliminar: (id: string) => Promise<Resultado<void>>
}) {
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" className="min-h-11">
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <ContenidoEliminarLista
          lista={lista}
          eliminar={eliminar}
          alCerrar={() => setOpen(false)}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
