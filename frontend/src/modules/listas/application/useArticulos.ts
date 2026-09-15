import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { useHogar } from '@/shared/hogar/hogar-contexto'
import { useSesion } from '@/shared/hogar/sesion-contexto'
import {
  desmarcarArticuloComprado,
  marcarArticuloComprado,
  ordenarArticulosPorIncorporacion,
} from '../domain/articulo'
import type { Articulo } from '../domain/articulo'
import { fallo } from './fallo'
import { useRecursosListas } from './hogar-listas'
import type { ErrorAplicacion, Resultado } from './useListas'

function contenidoValido(contenido: string): string | undefined {
  const normalizado = contenido.trim()
  return normalizado === '' ? undefined : normalizado
}

function ordenar(articulos: readonly Articulo[]): Articulo[] {
  return ordenarArticulosPorIncorporacion(articulos).sort((a, b) => {
    const porDominio =
      Number(a.comprado) - Number(b.comprado) ||
      Date.parse(a.createdAt) - Date.parse(b.createdAt)
    return porDominio || a.id.localeCompare(b.id)
  })
}

function datos<T>(valor: T[] | undefined): T[] {
  return valor ?? []
}

export function useArticulos(listaId: string) {
  const hogar = useHogar()
  const { user } = useSesion()
  const recursos = useRecursosListas()
  const consulta = useLiveQuery(() => recursos?.articulos)
  // The parent list is read through its own live query, not through an
  // imperative `get()`: a separately mounted article consumer must re-render
  // when its parent is optimistically deleted and again when that deletion
  // rolls back (design: article live queries join visible parent lists).
  const consultaListas = useLiveQuery(() => recursos?.listas)
  const [error, setError] = useState<ErrorAplicacion>()
  const listaActual = consultaListas.state?.get(listaId)
  const disponible =
    hogar.estado === 'ready' &&
    recursos?.householdId === hogar.hogar.id &&
    listaActual?.householdId === recursos.householdId

  // Identity of the scope an action was created under: household plus list.
  // Every callback captures it and both refuses to mutate and refuses to
  // report once it is no longer current, so neither a retained household-A
  // action nor a retained previous-list action can write, and a late failure
  // cannot overwrite the error of the scope that is current now.
  const alcance = disponible
    ? `${recursos.householdId.length}:${recursos.householdId}:${listaId}`
    : undefined
  const alcanceActual = useRef<string | undefined>(undefined)
  alcanceActual.current = alcance

  useEffect(
    () => setError(undefined),
    [listaId, recursos?.householdId, hogar.estado],
  )

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
  // The single household/list boundary. Every selection — the public
  // projection, single-record actions and the clear-bought selection — goes
  // through it, so a record that is invisible to the consumer can never be
  // reachable by a write.
  const enAlcance = useCallback(
    (articulo: Articulo | undefined): articulo is Articulo =>
      articulo !== undefined &&
      articulo.listaId === listaId &&
      articulo.householdId === recursos?.householdId,
    [listaId, recursos],
  )
  const actual = useCallback(
    (id: string) => {
      const articulo = recursos?.articulos.get(id)
      return enAlcance(articulo) ? articulo : undefined
    },
    [enAlcance, recursos],
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

  const agregar = useCallback(
    async (contenido: string): Promise<Resultado<string>> => {
      const normalizado = contenidoValido(contenido)
      if (
        !disponible ||
        !user ||
        !normalizado ||
        alcanceActual.current !== alcance
      )
        return invalidar(alcance, 'El contenido no es válido')
      const ahora = new Date().toISOString()
      const articulo: Articulo = {
        id: crypto.randomUUID(),
        listaId,
        householdId: recursos.householdId,
        contenido: normalizado,
        comprado: false,
        boughtAt: null,
        boughtBy: null,
        createdAt: ahora,
        createdBy: user.id,
        updatedAt: ahora,
        updatedBy: user.id,
      }
      return persistir(
        alcance,
        recursos.articulos.insert(articulo),
        articulo.id,
      )
    },
    [alcance, disponible, invalidar, listaId, persistir, recursos, user],
  )

  const editar = useCallback(
    async (id: string, contenido: string) => {
      const articulo = actual(id)
      const normalizado = contenidoValido(contenido)
      if (
        !disponible ||
        !articulo ||
        !normalizado ||
        alcanceActual.current !== alcance
      )
        return invalidar(alcance, 'El artículo no es válido')
      return persistir(
        alcance,
        recursos.articulos.update(id, (borrador) => {
          borrador.contenido = normalizado
        }),
        undefined,
      )
    },
    [actual, alcance, disponible, invalidar, persistir, recursos],
  )

  const marcar = useCallback(
    async (id: string) => {
      const articulo = actual(id)
      if (
        !disponible ||
        !articulo ||
        !user ||
        alcanceActual.current !== alcance
      )
        return invalidar(alcance, 'El artículo no es válido')
      const marcado = marcarArticuloComprado(
        articulo,
        new Date().toISOString(),
        user.id,
      )
      return persistir(
        alcance,
        recursos.articulos.update(id, (borrador) =>
          Object.assign(borrador, marcado),
        ),
        undefined,
      )
    },
    [actual, alcance, disponible, invalidar, persistir, recursos, user],
  )

  const desmarcar = useCallback(
    async (id: string) => {
      const articulo = actual(id)
      if (!disponible || !articulo || alcanceActual.current !== alcance)
        return invalidar(alcance, 'El artículo no es válido')
      const desmarcado = desmarcarArticuloComprado(articulo)
      return persistir(
        alcance,
        recursos.articulos.update(id, (borrador) =>
          Object.assign(borrador, desmarcado),
        ),
        undefined,
      )
    },
    [actual, alcance, disponible, invalidar, persistir, recursos],
  )

  const eliminar = useCallback(
    async (id: string) => {
      if (!disponible || !actual(id) || alcanceActual.current !== alcance)
        return invalidar(alcance, 'El artículo no es válido')
      return persistir(alcance, recursos.articulos.delete(id), undefined)
    },
    [actual, alcance, disponible, invalidar, persistir, recursos],
  )

  const limpiarComprados = useCallback(async () => {
    if (!disponible || alcanceActual.current !== alcance)
      return invalidar(alcance, 'La lista no está disponible')
    const seleccionados = ordenar(
      datos(consulta.data).filter(
        (articulo) => enAlcance(articulo) && articulo.comprado,
      ),
    )
    const resultados = await Promise.all(
      seleccionados.map(async (articulo) => ({
        id: articulo.id,
        resultado: await persistir(
          alcance,
          recursos.articulos.delete(articulo.id),
          undefined,
        ),
      })),
    )
    const successfulIds = resultados
      .filter(({ resultado }) => resultado.ok)
      .map(({ id }) => id)
    const failed = resultados.filter(({ resultado }) => !resultado.ok)
    if (failed.length > 0)
      reportar(
        alcance,
        fallo(
          'persistence',
          'No se pudieron borrar todos los artículos comprados',
        ),
      )
    return {
      ok: true as const,
      valor: {
        successfulIds,
        failedIds: failed.map(({ id }) => id),
        errors: failed
          .map(({ resultado }) => (!resultado.ok ? resultado.error : undefined))
          .filter(Boolean),
      },
    }
  }, [
    alcance,
    consulta.data,
    disponible,
    enAlcance,
    invalidar,
    persistir,
    recursos,
    reportar,
  ])

  return {
    articulos: disponible
      ? ordenar(datos(consulta.data).filter(enAlcance))
      : [],
    loading: !disponible || consulta.isLoading,
    ready: disponible && consulta.isReady,
    error:
      error ??
      (hogar.estado === 'error' ? fallo('realtime', hogar.error) : undefined),
    agregar,
    editar,
    marcar,
    desmarcar,
    eliminar,
    limpiarComprados,
  }
}
