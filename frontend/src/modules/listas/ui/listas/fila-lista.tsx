import { useId, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { Resultado } from '@/modules/listas'
import type { Lista } from '../../domain/lista'
import { copiaErrorLista } from './copia-error'
import { EliminarLista } from './eliminar-lista'
import { EnlaceLista } from './enlace-lista'
import { nombreValido } from './validacion'
import { usePendiente } from './pendiente'

// Row: view mode composes `EnlaceLista`; edit mode is a local form (design
// D3). All rename state (`editando`/`borrador`/`pendiente`/`errorFila`) is
// owned here so a keystroke in one row never re-renders the rest of the
// list. Enter (form submit) commits, Escape cancels, blur is a no-op — a
// mobile tap on "Guardar" blurs the input before the click handler runs.
export function FilaLista({
  lista,
  renombrar,
  eliminar,
}: {
  lista: Lista
  renombrar: (id: string, nombre: string) => Promise<Resultado<void>>
  eliminar: (id: string) => Promise<Resultado<void>>
}) {
  const inputId = useId()
  const errorId = useId()
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(lista.nombre)
  const { pendiente, ejecutar } = usePendiente()
  const [errorFila, setErrorFila] = useState<string>()

  function entrarEdicion() {
    setBorrador(lista.nombre)
    setErrorFila(undefined)
    setEditando(true)
  }

  function cancelar() {
    setBorrador(lista.nombre)
    setErrorFila(undefined)
    setEditando(false)
  }

  function alTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') cancelar()
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const normalizado = nombreValido(borrador)
    if (!normalizado) {
      setErrorFila('El nombre no puede estar vacío.')
      return
    }
    if (normalizado === lista.nombre) {
      setEditando(false)
      return
    }
    setErrorFila(undefined)
    const resultado = await ejecutar(() => renombrar(lista.id, normalizado))
    if (resultado.ok) {
      setEditando(false)
      return
    }
    setErrorFila(copiaErrorLista(resultado.error))
  }

  if (!editando) {
    return (
      <li className="flex items-center justify-between gap-2">
        <EnlaceLista lista={lista} />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 min-w-11"
            onClick={entrarEdicion}
          >
            Renombrar
          </Button>
          <EliminarLista lista={lista} eliminar={eliminar} />
        </div>
      </li>
    )
  }

  return (
    <li>
      <form onSubmit={enviar} className="flex flex-col gap-2" noValidate>
        <Label htmlFor={inputId} className="sr-only">
          Nombre de la lista
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            autoFocus
            className="h-11"
            value={borrador}
            onChange={(evento) => setBorrador(evento.target.value)}
            onKeyDown={alTecla}
            aria-invalid={errorFila ? true : undefined}
            aria-describedby={errorFila ? errorId : undefined}
          />
          <Button
            type="submit"
            className="min-h-11 min-w-11"
            disabled={pendiente}
            aria-busy={pendiente}
          >
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 min-w-11"
            onClick={cancelar}
          >
            Cancelar
          </Button>
        </div>
        {errorFila && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {errorFila}
          </p>
        )}
      </form>
    </li>
  )
}
