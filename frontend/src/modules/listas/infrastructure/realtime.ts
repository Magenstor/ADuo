import type { Collection } from '@tanstack/react-db'
import type { RealtimeErrorPayload, SocketMessage } from '@insforge/sdk'
import { insforge } from '@/shared/api/insforge'
import { listaDesdeFila } from './listasRepository'
import type { FilaLista } from './listasRepository'
import { articuloDesdeFila } from './articulosRepository'
import type { FilaArticulo } from './articulosRepository'
import type { Lista } from '../domain/lista'
import type { Articulo } from '../domain/articulo'

// Translates a household's realtime channel into direct writes on
// `listasCollection` / `articulosCollection`. Never imports `@/shared/hogar`
// or `@/app/**` (docs/03-Arquitectura.md §3.2) — `householdId` and the
// collections both arrive as parameters (design D5).

export type ColeccionesRealtime = {
  listas: Collection<Lista, string>
  articulos: Collection<Articulo, string>
}

export type FalloRealtime =
  | { tipo: 'socket'; causa: unknown }
  | { tipo: 'mensaje-ilegible'; evento: string; causa: string }
  | { tipo: 'evento-desconocido'; evento: string }

export type SuscripcionHogar = { detener: () => Promise<void> }

// A shared socket needs ordered channel transitions: a late old-generation
// unsubscribe must finish before a new generation subscribes to that channel.
let colaDeSuscripciones: Promise<void> = Promise.resolve()

function encolar<T>(operacion: () => Promise<T>): Promise<T> {
  const siguiente = colaDeSuscripciones.then(operacion, operacion)
  colaDeSuscripciones = siguiente.then(
    () => undefined,
    () => undefined,
  )
  return siguiente
}

// One named predicate confines the internal, publicly-typed-but-not-publicly-
// contracted read (design D2). `_state` and `syncedData` are both declared
// `public` in `@tanstack/db@0.8.1` and ship in the package's `.d.ts`, but the
// author's own comment scopes the intent to tests/debugging — hence a single
// call site instead of scattering the read across every delete handler.
export function estaSincronizado<T extends object>(
  coleccion: Collection<T, string>,
  clave: string,
): boolean {
  return coleccion._state.syncedData.has(clave)
}

// Reads `meta.channel` without trusting the SDK's static shape: an envelope
// with a missing or null `meta` must reach `filaDesdeMensaje`, whose guard
// reports and drops it, instead of throwing here outside every `try`.
function canalDelMensaje(mensaje: unknown): string | undefined {
  if (typeof mensaje !== 'object' || mensaje === null || !('meta' in mensaje))
    return undefined
  const meta: unknown = mensaje.meta
  if (typeof meta !== 'object' || meta === null || !('channel' in meta))
    return undefined
  return typeof meta.channel === 'string' ? meta.channel : undefined
}

// Two gates in front of every translator: the household channel, and the
// owner's scope. Once the owner aborts its signal the scope is retired, so an
// event arriving between that abort and `detener()` must not touch resources
// the owner may already be cleaning up.
function soloCanal(
  canal: string,
  signal: AbortSignal | undefined,
  manejador: (mensaje: SocketMessage) => void,
) {
  return (mensaje: SocketMessage) => {
    if (signal?.aborted) return
    const canalMensaje = canalDelMensaje(mensaje)
    if (canalMensaje !== undefined && canalMensaje !== canal) return
    manejador(mensaje)
  }
}

function causaComoTexto(causa: unknown): string {
  return causa instanceof Error ? causa.message : String(causa)
}

// The one adapter every event passes through (spec: "Envelope parsing via
// one narrow adapter"). Defends against three research findings: a flat
// envelope with no `payload`/`new` wrapper (Q2), `meta.senderId` being either
// `undefined` or `null` (Q1) — never branched on — and a hypothetical future
// `meta` column collision (design guard #3). A message that fails the shape
// guard, or whose `meta.senderType` is not `'system'` (the only origin the
// household channel should ever carry — `008_realtime.sql` grants no INSERT
// policy on `realtime.messages` to anyone), is not something this adapter can
// safely translate: it throws so the caller can report and drop it, rather
// than risk misapplying an untrusted shape.
//
// Null-vs-missing normalization for `bought_by` / `bought_at` (research Q3)
// lives here rather than in `articuloDesdeFila`: that mapper reads the two
// fields directly with no `??`, so an absent key would otherwise surface as
// `undefined` instead of `null` for a list event with no purchase fields at
// all, the extra `null` keys are harmless — `listaDesdeFila` ignores them.
export function filaDesdeMensaje(
  mensaje: SocketMessage,
): Record<string, unknown> {
  const { meta, ...fila } = mensaje
  // The SDK declares `meta` as always present and well-formed, but this guard
  // exists precisely for envelopes that violate that declaration, so it
  // narrows from `unknown` instead of trusting the static shape.
  const metaDesconocido: unknown = meta

  if (
    typeof metaDesconocido !== 'object' ||
    metaDesconocido === null ||
    !('messageId' in metaDesconocido) ||
    typeof metaDesconocido.messageId !== 'string'
  ) {
    throw new Error('Realtime message is missing a well-formed meta envelope')
  }

  if (meta.senderType !== 'system') {
    throw new Error('Realtime message did not originate from a system trigger')
  }

  return {
    ...fila,
    bought_at: (fila as { bought_at?: unknown }).bought_at ?? null,
    bought_by: (fila as { bought_by?: unknown }).bought_by ?? null,
  }
}

// D1: `insert` and `update` both map to `writeUpsert`, never `writeInsert` /
// `writeUpdate`. `writeUpsert` reads `syncedData.has(key)` itself and never
// throws on a missing or an already-present key, which is what makes a
// server echo of our own optimistic insert (never byte-equal, since
// `updated_at`/`updated_by` are server-managed) safe to apply.
function crearManejadorEscritura<T extends object>(
  coleccion: Collection<T, string>,
  evento: string,
  mapear: (fila: Record<string, unknown>) => T,
  alReportar: (fallo: FalloRealtime) => void,
): (mensaje: SocketMessage) => void {
  return (mensaje) => {
    try {
      const fila = filaDesdeMensaje(mensaje)
      coleccion.utils.writeUpsert(mapear(fila))
    } catch (causa) {
      alReportar({
        tipo: 'mensaje-ilegible',
        evento,
        causa: causaComoTexto(causa),
      })
    }
  }
}

// D2 + D3: one direct `writeDelete` per message, guarded by `estaSincronizado`
// so a key the server already removed via cascade (task 019: `list.delete`
// is published before its `item.delete` events) is filtered out before it
// ever reaches `writeDelete`, instead of being caught after the fact — a
// `try`/`catch` around the whole batch would discard every surviving
// operation queued alongside it.
function crearManejadorBorrado<T extends object>(
  coleccion: Collection<T, string>,
  evento: string,
  idDeMensaje: (fila: Record<string, unknown>) => string,
  alReportar: (fallo: FalloRealtime) => void,
): (mensaje: SocketMessage) => void {
  return (mensaje) => {
    try {
      const fila = filaDesdeMensaje(mensaje)
      const clave = idDeMensaje(fila)

      if (!estaSincronizado(coleccion, clave)) {
        return
      }

      coleccion.utils.writeDelete(clave)
    } catch (causa) {
      alReportar({
        tipo: 'mensaje-ilegible',
        evento,
        causa: causaComoTexto(causa),
      })
    }
  }
}

// D4: children first, then the parent. The articulos cascade keys are read
// straight out of `syncedData`, so they are unique by construction and every
// one is provably present — that `writeBatch` cannot throw, which is exactly
// why it is the one place `writeBatch` is used at all (D3). If the lista
// delete fails after the cascade committed, the residue is an empty, legal
// `Lista` that task 046's refetch repairs; the reverse order would orphan
// `Articulo` rows nothing ever cleans up.
function crearManejadorBorradoLista(
  colecciones: ColeccionesRealtime,
  evento: string,
  alReportar: (fallo: FalloRealtime) => void,
): (mensaje: SocketMessage) => void {
  return (mensaje) => {
    try {
      const fila = filaDesdeMensaje(mensaje)
      const listaId = String(fila.id)

      const clavesArticulos = Array.from(
        colecciones.articulos._state.syncedData.values(),
      )
        .filter((articulo) => articulo.listaId === listaId)
        .map((articulo) => articulo.id)

      if (clavesArticulos.length > 0) {
        colecciones.articulos.utils.writeBatch(() => {
          clavesArticulos.forEach((clave) =>
            colecciones.articulos.utils.writeDelete(clave),
          )
        })
      }

      if (estaSincronizado(colecciones.listas, listaId)) {
        colecciones.listas.utils.writeDelete(listaId)
      }
    } catch (causa) {
      alReportar({
        tipo: 'mensaje-ilegible',
        evento,
        causa: causaComoTexto(causa),
      })
    }
  }
}

// Connects, subscribes to `household:<id>`, and registers one handler per
// event. D7: the `error` handler only reports — it never throws, invalidates,
// or retries; `socket.io-client` (an `@insforge/sdk` dependency) owns
// reconnection, and task 046's `refetchOnReconnect: 'always'` owns repairing
// anything the socket missed while disconnected.
export async function iniciarSuscripcionHogar(
  householdId: string,
  colecciones: ColeccionesRealtime,
  alReportar: (fallo: FalloRealtime) => void = console.error,
  signal?: AbortSignal,
): Promise<SuscripcionHogar> {
  const canal = `household:${householdId}`
  const manejadorListaInsert = crearManejadorEscritura(
    colecciones.listas,
    'list.insert',
    (fila) => listaDesdeFila(fila as unknown as FilaLista),
    alReportar,
  )
  const manejadorListaUpdate = crearManejadorEscritura(
    colecciones.listas,
    'list.update',
    (fila) => listaDesdeFila(fila as unknown as FilaLista),
    alReportar,
  )
  const manejadorListaDelete = crearManejadorBorradoLista(
    colecciones,
    'list.delete',
    alReportar,
  )
  const manejadorArticuloInsert = crearManejadorEscritura(
    colecciones.articulos,
    'item.insert',
    (fila) => articuloDesdeFila(fila as unknown as FilaArticulo),
    alReportar,
  )
  const manejadorArticuloUpdate = crearManejadorEscritura(
    colecciones.articulos,
    'item.update',
    (fila) => articuloDesdeFila(fila as unknown as FilaArticulo),
    alReportar,
  )
  const manejadorArticuloDelete = crearManejadorBorrado(
    colecciones.articulos,
    'item.delete',
    (fila) => String(fila.id),
    alReportar,
  )
  const manejadorError = (error: RealtimeErrorPayload) =>
    alReportar({ tipo: 'socket', causa: error })
  const manejadores = {
    listaInsert: soloCanal(canal, signal, manejadorListaInsert),
    listaUpdate: soloCanal(canal, signal, manejadorListaUpdate),
    listaDelete: soloCanal(canal, signal, manejadorListaDelete),
    articuloInsert: soloCanal(canal, signal, manejadorArticuloInsert),
    articuloUpdate: soloCanal(canal, signal, manejadorArticuloUpdate),
    articuloDelete: soloCanal(canal, signal, manejadorArticuloDelete),
  }
  const quitarManejadores = () => {
    insforge.realtime.off('list.insert', manejadores.listaInsert)
    insforge.realtime.off('list.update', manejadores.listaUpdate)
    insforge.realtime.off('list.delete', manejadores.listaDelete)
    insforge.realtime.off('item.insert', manejadores.articuloInsert)
    insforge.realtime.off('item.update', manejadores.articuloUpdate)
    insforge.realtime.off('item.delete', manejadores.articuloDelete)
    insforge.realtime.off('error', manejadorError)
    insforge.realtime.off('connect_error', manejadorError)
  }

  // Register before connect so no event can race successful subscription setup.
  insforge.realtime.on('list.insert', manejadores.listaInsert)
  insforge.realtime.on('list.update', manejadores.listaUpdate)
  insforge.realtime.on('list.delete', manejadores.listaDelete)
  insforge.realtime.on('item.insert', manejadores.articuloInsert)
  insforge.realtime.on('item.update', manejadores.articuloUpdate)
  insforge.realtime.on('item.delete', manejadores.articuloDelete)
  insforge.realtime.on('error', manejadorError)
  insforge.realtime.on('connect_error', manejadorError)

  try {
    await encolar(async () => {
      if (signal?.aborted)
        throw new DOMException('Subscription aborted', 'AbortError')
      await insforge.realtime.connect()
      if (signal?.aborted)
        throw new DOMException('Subscription aborted', 'AbortError')
      const resultado = await insforge.realtime.subscribe(canal)
      if (!resultado.ok) throw new Error(resultado.error.message)
    })
  } catch (causa) {
    quitarManejadores()
    alReportar({ tipo: 'socket', causa })
    throw causa
  }

  let detenido = false
  return {
    detener: async () => {
      if (detenido) return
      detenido = true
      quitarManejadores()
      await encolar(async () => {
        await insforge.realtime.unsubscribe(canal)
      })
    },
  }
}
