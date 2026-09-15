import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Hogar, ErrorHogar } from '@/shared/hogar/hogar-repository'
import { crearListasCollection } from '../infrastructure/listasCollection'
import { crearArticulosCollection } from '../infrastructure/articulosCollection'
import { iniciarSuscripcionHogar } from '../infrastructure/realtime'
import type {
  ColeccionesRealtime,
  SuscripcionHogar,
} from '../infrastructure/realtime'

export type RecursosListas = ColeccionesRealtime & { householdId: string }

const ContextoRecursosListas = createContext<RecursosListas | undefined>(
  undefined,
)

export function useRecursosListas(): RecursosListas | undefined {
  return useContext(ContextoRecursosListas)
}

function estaAbortado(signal: AbortSignal): boolean {
  return signal.aborted
}

function errorRealtime(causa: unknown): ErrorHogar {
  const error = causa instanceof Error ? causa : new Error(String(causa))
  return Object.assign(error, { tipo: 'realtime' as const })
}

// The retirement queue is module-owned, not instance-owned, for the same
// reason `realtime.ts` serializes channel transitions at module level: the
// resources it orders (the shared query cache and the shared socket) outlive
// any boundary instance. `HogarProvider` unmounts and recreates this boundary
// on every session transition, so an instance-local queue would be discarded
// with the instance and let the next household's setup race the previous
// household's teardown on the very same cache keys.
let colaLimpieza: Promise<void> = Promise.resolve()

function encolarLimpieza(operacion: () => Promise<void>): Promise<void> {
  const siguiente = colaLimpieza.then(operacion, operacion)
  colaLimpieza = siguiente.then(
    () => undefined,
    () => undefined,
  )
  return siguiente
}

// Symmetric teardown, in the order the resources were acquired reversed:
// subscription, then collections, then the household's query keys.
async function limpiarScope(
  queryClient: ReturnType<typeof useQueryClient>,
  recursos: RecursosListas,
  suscripcion: SuscripcionHogar | undefined,
): Promise<void> {
  await suscripcion?.detener()
  await Promise.all([recursos.listas.cleanup(), recursos.articulos.cleanup()])
  await Promise.all([
    queryClient.cancelQueries({ queryKey: ['listas', recursos.householdId] }),
    queryClient.cancelQueries({
      queryKey: ['articulos', recursos.householdId],
    }),
  ])
  queryClient.removeQueries({ queryKey: ['listas', recursos.householdId] })
  queryClient.removeQueries({ queryKey: ['articulos', recursos.householdId] })
}

export function HogarListas({
  hogar,
  alError,
  children,
}: {
  hogar: Hogar
  alError: (error: ErrorHogar) => void
  children?: ReactNode
}) {
  const queryClient = useQueryClient()
  const [recursos, setRecursos] = useState<RecursosListas>()
  const generacion = useRef(0)

  useEffect(() => {
    const actual = ++generacion.current
    const controlador = new AbortController()
    const scope: RecursosListas = {
      householdId: hogar.id,
      listas: crearListasCollection(queryClient, hogar.id),
      articulos: crearArticulosCollection(queryClient, hogar.id),
    }
    const retiroAnterior = colaLimpieza
    setRecursos(undefined)

    // Resolves with whatever this generation acquired, and never rejects, so
    // the teardown below can wait for it and release exactly that.
    const instalacion = (async (): Promise<SuscripcionHogar | undefined> => {
      await retiroAnterior
      if (estaAbortado(controlador.signal)) return undefined
      try {
        await Promise.all([scope.listas.preload(), scope.articulos.preload()])
        if (estaAbortado(controlador.signal)) return undefined
        const suscripcion = await iniciarSuscripcionHogar(
          hogar.id,
          scope,
          (fallo) => {
            if (
              generacion.current === actual &&
              !estaAbortado(controlador.signal)
            )
              alError(errorRealtime('causa' in fallo ? fallo.causa : fallo))
          },
          controlador.signal,
        )
        if (estaAbortado(controlador.signal) || generacion.current !== actual)
          return suscripcion
        setRecursos(scope)
        return suscripcion
      } catch (causa) {
        if (generacion.current === actual && !estaAbortado(controlador.signal))
          alError(errorRealtime(causa))
        return undefined
      }
    })()

    return () => {
      controlador.abort()
      // Wait for the in-flight setup first: a preload that settles after the
      // abort still writes into the cache, and a subscription that resolves
      // after the abort still exists, so both must be released after they
      // settle, not before.
      void encolarLimpieza(async () => {
        const suscripcion = await instalacion
        await limpiarScope(queryClient, scope, suscripcion)
      })
    }
  }, [alError, hogar.id, queryClient])

  return (
    <ContextoRecursosListas.Provider value={recursos}>
      {children}
    </ContextoRecursosListas.Provider>
  )
}
