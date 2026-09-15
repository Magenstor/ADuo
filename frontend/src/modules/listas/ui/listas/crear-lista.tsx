import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { Resultado } from '@/modules/listas'
import { copiaErrorLista } from './copia-error'
import { nombreValido } from './validacion'

// Reusable create-list form (design D4): one component, rendered as
// `EstadoVacio`'s `children` when the household has no lists yet, and above
// the row list otherwise. Pending state is a plain `useState<boolean>`
// (design D6) — only one control is disabled, no urgent/non-urgent split.
export function CrearLista({
  crear,
}: {
  crear: (nombre: string) => Promise<Resultado<string>>
}) {
  const inputId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [nombre, setNombre] = useState('')
  const [pendiente, setPendiente] = useState(false)
  const [error, setError] = useState<string>()

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const normalizado = nombreValido(nombre)
    if (!normalizado) {
      setError('El nombre no puede estar vacío.')
      return
    }
    setError(undefined)
    setPendiente(true)
    const resultado = await crear(normalizado)
    setPendiente(false)
    if (resultado.ok) {
      setNombre('')
      inputRef.current?.focus()
      return
    }
    setError(copiaErrorLista(resultado.error))
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2" noValidate>
      <Label htmlFor={inputId}>Nombre de la lista</Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          ref={inputRef}
          className="h-11"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <Button
          type="submit"
          className="min-h-11 min-w-11"
          disabled={pendiente}
          aria-busy={pendiente}
        >
          Crear
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
