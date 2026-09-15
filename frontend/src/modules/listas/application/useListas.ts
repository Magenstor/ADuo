import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { useHogar } from '@/shared/hogar/hogar-contexto'
import { useSesion } from '@/shared/hogar/sesion-contexto'
import { crearLista } from '../domain/lista'
import type { Lista } from '../domain/lista'
import { fallo } from './fallo'
import { useRecursosListas } from './hogar-listas'

export type ErrorAplicacion = Error & {
  tipo: 'validation' | 'persistence' | 'query' | 'realtime'
}
export type Resultado<T> =
  { ok: true; valor: T } | { ok: false; error: ErrorAplicacion }

function ordenarListas(listas: readonly Lista[]): Lista[] {
  return [...listas].sort(
    (a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      a.id.localeCompare(b.id),
  )
}

function datos<T>(valor: T[] | undefined): T[] {
  return valor ?? []
}

export function useListas() {
  const hogar = useHogar()
  const { user } = useSesion()
  const recursos = useRecursosListas()
  const consulta = useLiveQuery(() => recursos?.listas)
  const [error, setError] = useState<ErrorAplicacion>()
  const disponible =
    hogar.estado === 'ready' && recursos?.householdId === hogar.hogar.id
  // Identity of the scope an action was created under. Every callback captures
  // it and both refuses to mutate and refuses to report once it is no longer
  // the current scope, so a retained household-A action can neither write to A
  // nor overwrite household B's error when it settles late.
  const alcance = disponible ? recursos.householdId : undefined
  const alcanceActual = useRef<string | undefined>(undefined)
  alcanceActual.current = alcance

  useEffect(() => setError(undefined), [recursos?.householdId, hogar.estado])

  const reportar = useCallback(
    (generacion: string | undefined, causa?: ErrorAplicacion) => {
      if (alcanceActual.current === generacion) setError(causa)
    },
    [],
  )

  const invalidar = useCallback(
    (generacion: string | undefined, causa: unknown) => {
      const errorValidacion = fallo('validation', causa)
      reportar(generacion, errorValidacion)
      return { ok: false as const, error: errorValidacion }
    },
    [reportar],
  )

  const persistir = useCallback(
    async <T>(
      generacion: string | undefined,
      transaccion: { isPersisted: { promise: Promise<unknown> } },
      valor: T,
    ): Promise<Resultado<T>> => {
      try {
        await transaccion.isPersisted.promise
        reportar(generacion, undefined)
        return { ok: true, valor }
      } catch (causa) {
        const errorPersistencia = fallo('persistence', causa)
        reportar(generacion, errorPersistencia)
        return { ok: false, error: errorPersistencia }
      }
    },
    [reportar],
  )

  const crear = useCallback(
    async (nombre: string): Promise<Resultado<string>> => {
      if (!disponible || !user || alcanceActual.current !== alcance)
        return invalidar(alcance, 'No hay un hogar disponible')
      const ahora = new Date().toISOString()
      const resultado = crearLista({
        id: crypto.randomUUID(),
        householdId: recursos.householdId,
        nombre,
        createdAt: ahora,
        createdBy: user.id,
        updatedAt: ahora,
        updatedBy: user.id,
      })
      if (!resultado.ok) return invalidar(alcance, resultado.error)
      return persistir(
        alcance,
        recursos.listas.insert(resultado.lista),
        resultado.lista.id,
      )
    },
    [alcance, disponible, invalidar, persistir, recursos, user],
  )

  const renombrar = useCallback(
    async (id: string, nombre: string): Promise<Resultado<void>> => {
      const actual = recursos?.listas.get(id)
      if (
        !disponible ||
        !actual ||
        actual.householdId !== recursos.householdId ||
        alcanceActual.current !== alcance
      ) {
        return invalidar(alcance, 'La lista no está disponible')
      }
      const resultado = crearLista({ ...actual, nombre })
      if (!resultado.ok) return invalidar(alcance, resultado.error)
      return persistir(
        alcance,
        recursos.listas.update(id, (borrador) => {
          borrador.nombre = resultado.lista.nombre
        }),
        undefined,
      )
    },
    [alcance, disponible, invalidar, persistir, recursos],
  )

  const eliminar = useCallback(
    async (id: string): Promise<Resultado<void>> => {
      const actual = recursos?.listas.get(id)
      if (
        !disponible ||
        !actual ||
        actual.householdId !== recursos.householdId ||
        alcanceActual.current !== alcance
      ) {
        return invalidar(alcance, 'La lista no está disponible')
      }
      return persistir(alcance, recursos.listas.delete(id), undefined)
    },
    [alcance, disponible, invalidar, persistir, recursos],
  )

  return {
    listas: disponible
      ? ordenarListas(
          datos(consulta.data).filter(
            (lista) => lista.householdId === recursos.householdId,
          ),
        )
      : [],
    loading: !disponible || consulta.isLoading,
    ready: disponible && consulta.isReady,
    error:
      error ??
      (hogar.estado === 'error' ? fallo('realtime', hogar.error) : undefined),
    crear,
    renombrar,
    eliminar,
  }
}
