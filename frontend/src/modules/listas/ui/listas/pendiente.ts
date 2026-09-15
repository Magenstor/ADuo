import { useCallback, useState } from 'react'
import type { Resultado } from '@/modules/listas'

// Shared pending-flag pattern (design D6): `CrearLista`, `FilaLista`'s
// rename submit, and `ContenidoEliminarLista`'s confirm all wrap a single
// `Resultado`-returning call the same way — flip `pendiente` on, await,
// flip it off, hand the settled result back to the caller's own ok/else
// branch. Extracted here once three call sites repeated it (task 7 REFACTOR).
export function usePendiente() {
  const [pendiente, setPendiente] = useState(false)

  const ejecutar = useCallback(
    async <T>(accion: () => Promise<Resultado<T>>): Promise<Resultado<T>> => {
      setPendiente(true)
      const resultado = await accion()
      setPendiente(false)
      return resultado
    },
    [],
  )

  return { pendiente, ejecutar }
}
