import { QueryClient } from '@tanstack/react-query'
import type { SocketMessage } from '@insforge/sdk'
import {
  estaSincronizado,
  filaDesdeMensaje,
  iniciarSuscripcionHogar,
} from './realtime'
import { crearListasCollection } from './listasCollection'
import { crearArticulosCollection } from './articulosCollection'
import type * as ListasRepository from './listasRepository'
import type * as ArticulosRepository from './articulosRepository'

// Fakes `insforge.realtime` as an in-memory event emitter, following the
// `@/shared/api/insforge`-boundary-mocking convention established in
// `use-sesion.test.ts`. `.connect()`/`.subscribe()` resolve immediately;
// `.on()`/`.off()` register/unregister against a local listener map that
// `emitirEvento` drives directly — no real socket anywhere in this file.
const { realtime, emitirEvento, reiniciarEscuchas } = vi.hoisted(() => {
  const escuchas = new Map<string, Set<(payload: unknown) => void>>()
  return {
    realtime: {
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue({
        ok: true,
        channel: '',
        presence: { members: [] },
      }),
      unsubscribe: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn((evento: string, callback: (payload: unknown) => void) => {
        if (!escuchas.has(evento)) escuchas.set(evento, new Set())
        escuchas.get(evento)?.add(callback)
      }),
      off: vi.fn((evento: string, callback: (payload: unknown) => void) => {
        escuchas.get(evento)?.delete(callback)
      }),
    },
    emitirEvento: (evento: string, payload: unknown) => {
      escuchas.get(evento)?.forEach((callback) => callback(payload))
    },
    reiniciarEscuchas: () => escuchas.clear(),
  }
})
vi.mock('@/shared/api/insforge', () => ({ insforge: { realtime } }))

// `obtenerListas`/`obtenerArticulos` are mocked purely so `collection.preload()`
// resolves without a network call; `insertarArticulo` is mocked so the one
// test that optimistically `.insert()`s does not hit `insforge.database`
// either (that mock only exposes `realtime`, per the boundary-mocking
// convention above). Every other write in this file goes through
// `writeUpsert`/`writeDelete` directly and never touches the repository.
// The pure mapping functions (`listaDesdeFila`, `articuloDesdeFila`) stay
// real via `importActual` — `realtime.ts` itself calls them, and this file
// asserts on their real output.
const { obtenerListas } = vi.hoisted(() => ({ obtenerListas: vi.fn() }))
vi.mock('./listasRepository', async () => {
  const actual =
    await vi.importActual<typeof ListasRepository>('./listasRepository')
  return {
    listaDesdeFila: actual.listaDesdeFila,
    filaDesdeLista: actual.filaDesdeLista,
    obtenerListas,
  }
})
const { obtenerArticulos, insertarArticulo } = vi.hoisted(() => ({
  obtenerArticulos: vi.fn(),
  insertarArticulo: vi.fn(),
}))
vi.mock('./articulosRepository', async () => {
  const actual = await vi.importActual<typeof ArticulosRepository>(
    './articulosRepository',
  )
  return {
    articuloDesdeFila: actual.articuloDesdeFila,
    filaDesdeArticulo: actual.filaDesdeArticulo,
    obtenerArticulos,
    insertarArticulo,
  }
})

function filaListaCruda(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lista-1',
    household_id: 'hogar-1',
    name: 'Compra semanal',
    created_at: '2026-02-03T04:05:06.789Z',
    created_by: 'usuario-creador',
    updated_at: '2026-02-03T05:06:07.890Z',
    updated_by: 'usuario-actualizador',
    ...overrides,
  }
}

function filaArticuloCruda(overrides: Record<string, unknown> = {}) {
  return {
    id: 'articulo-1',
    list_id: 'lista-1',
    household_id: 'hogar-1',
    content: 'Leche',
    is_bought: false,
    bought_by: null,
    bought_at: null,
    created_at: '2026-02-03T04:05:06.789Z',
    created_by: 'usuario-creador',
    updated_at: '2026-02-03T05:06:07.890Z',
    updated_by: 'usuario-actualizador',
    ...overrides,
  }
}

function unMensaje(
  fila: Record<string, unknown>,
  overridesMeta: Record<string, unknown> = {},
): SocketMessage {
  return {
    meta: {
      messageId: 'mensaje-1',
      senderType: 'system',
      timestamp: '2026-02-03T05:06:07.890Z',
      ...overridesMeta,
    },
    ...fila,
  }
}

async function construirColecciones(
  queryClient: QueryClient,
  householdId: string,
) {
  obtenerListas.mockResolvedValue([])
  obtenerArticulos.mockResolvedValue([])
  const listas = crearListasCollection(queryClient, householdId)
  const articulos = crearArticulosCollection(queryClient, householdId)
  await listas.preload()
  await articulos.preload()
  return { listas, articulos }
}

beforeEach(() => {
  vi.clearAllMocks()
  reiniciarEscuchas()
})

describe('iniciarSuscripcionHogar — household-parameterized connect and subscribe', () => {
  it('subscribes to channel household:<id> using only the supplied householdId', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(
      queryClient,
      'hogar-de-las-colecciones',
    )

    await iniciarSuscripcionHogar('a1b2c3', colecciones)

    expect(realtime.connect).toHaveBeenCalledTimes(1)
    expect(realtime.subscribe).toHaveBeenCalledWith('household:a1b2c3')
  })
})

describe('iniciarSuscripcionHogar — six-event translation', () => {
  it('a list.insert event lands in listasCollection as a single writeUpsert, no writeBatch, no invalidation', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    const espiaInvalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const espiaBatch = vi.spyOn(colecciones.listas.utils, 'writeBatch')
    await iniciarSuscripcionHogar('hogar-1', colecciones)

    emitirEvento(
      'list.insert',
      unMensaje(filaListaCruda({ id: 'lista-nueva' })),
    )

    expect(colecciones.listas.get('lista-nueva')).toMatchObject({
      id: 'lista-nueva',
      nombre: 'Compra semanal',
    })
    expect(espiaBatch).not.toHaveBeenCalled()
    expect(espiaInvalidar).not.toHaveBeenCalled()
  })

  it('a list.insert echo for an already-synced list does not throw and lands the message values (D1 regression)', async () => {
    const queryClient = new QueryClient()
    obtenerListas.mockResolvedValue([filaListaCrudaComoLista(filaListaCruda())])
    obtenerArticulos.mockResolvedValue([])
    const listas = crearListasCollection(queryClient, 'hogar-1')
    const articulos = crearArticulosCollection(queryClient, 'hogar-1')
    await listas.preload()
    await articulos.preload()
    await iniciarSuscripcionHogar('hogar-1', { listas, articulos })

    expect(() =>
      emitirEvento(
        'list.insert',
        unMensaje(
          filaListaCruda({
            updated_at: '2027-01-01T00:00:00.000Z',
            updated_by: 'otro-dispositivo',
          }),
        ),
      ),
    ).not.toThrow()

    expect(listas.get('lista-1')).toMatchObject({
      updatedAt: '2027-01-01T00:00:00.000Z',
      updatedBy: 'otro-dispositivo',
    })
  })

  it('an item.update event lands in articulosCollection as a single writeUpsert, no writeBatch, no invalidation', async () => {
    const queryClient = new QueryClient()
    obtenerListas.mockResolvedValue([])
    obtenerArticulos.mockResolvedValue([])
    const listas = crearListasCollection(queryClient, 'hogar-1')
    const articulos = crearArticulosCollection(queryClient, 'hogar-1')
    await listas.preload()
    await articulos.preload()
    articulos.utils.writeUpsert(filaArticuloComoArticulo(filaArticuloCruda()))
    const espiaInvalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const espiaBatch = vi.spyOn(articulos.utils, 'writeBatch')
    await iniciarSuscripcionHogar('hogar-1', { listas, articulos })

    emitirEvento(
      'item.update',
      unMensaje(filaArticuloCruda({ content: 'Pan integral' })),
    )

    expect(articulos.get('articulo-1')).toMatchObject({
      contenido: 'Pan integral',
    })
    expect(espiaBatch).not.toHaveBeenCalled()
    expect(espiaInvalidar).not.toHaveBeenCalled()
  })

  it('a list.update event lands in listasCollection and an item.insert event lands in articulosCollection', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    colecciones.listas.utils.writeUpsert(
      filaListaCrudaComoLista(filaListaCruda()),
    )
    await iniciarSuscripcionHogar('hogar-1', colecciones)

    emitirEvento(
      'list.update',
      unMensaje(filaListaCruda({ name: 'Compra actualizada' })),
    )
    emitirEvento(
      'item.insert',
      unMensaje(filaArticuloCruda({ id: 'articulo-nuevo' })),
    )

    expect(colecciones.listas.get('lista-1')).toMatchObject({
      nombre: 'Compra actualizada',
    })
    expect(colecciones.articulos.get('articulo-nuevo')).toMatchObject({
      id: 'articulo-nuevo',
      contenido: 'Leche',
    })
  })
})

describe('iniciarSuscripcionHogar — registered realtime error handler', () => {
  it('invokes the reporter with no unhandled error escaping the subscription setup', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    const alReportar = vi.fn()
    await iniciarSuscripcionHogar('hogar-1', colecciones, alReportar)

    const error = { code: 'INTERNAL_ERROR', message: 'boom' }
    expect(() => emitirEvento('error', error)).not.toThrow()

    expect(alReportar).toHaveBeenCalledWith({ tipo: 'socket', causa: error })
  })
})

describe('iniciarSuscripcionHogar — no query invalidation on any realtime event', () => {
  it('never calls invalidateQueries while handling a list.update and an item.insert', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    colecciones.listas.utils.writeUpsert(
      filaListaCrudaComoLista(filaListaCruda()),
    )
    const espia = vi.spyOn(queryClient, 'invalidateQueries')
    await iniciarSuscripcionHogar('hogar-1', colecciones)

    emitirEvento(
      'list.update',
      unMensaje(filaListaCruda({ name: 'Otro nombre' })),
    )
    emitirEvento(
      'item.insert',
      unMensaje(filaArticuloCruda({ id: 'articulo-otro' })),
    )

    expect(espia).not.toHaveBeenCalled()
  })
})

describe('iniciarSuscripcionHogar — cascade-safe batch membership filtering', () => {
  it('a list.delete followed by item.delete for its already-cascaded items does not throw', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    colecciones.listas.utils.writeUpsert(
      filaListaCrudaComoLista(filaListaCruda()),
    )
    colecciones.articulos.utils.writeUpsert([
      filaArticuloComoArticulo(filaArticuloCruda({ id: 'articulo-1' })),
      filaArticuloComoArticulo(filaArticuloCruda({ id: 'articulo-2' })),
    ])
    // `alReportar` is a spy, not just an absence-of-throw check: the
    // subscription's own `try`/`catch` would otherwise mask a regressed,
    // unguarded `writeDelete` as a silently-swallowed 'mensaje-ilegible'
    // report instead of the idempotent no-op the cascade requires — this is
    // what makes the test fail against a naive forward-everything
    // implementation rather than only against a literal uncaught throw.
    const alReportar = vi.fn()
    await iniciarSuscripcionHogar('hogar-1', colecciones, alReportar)

    expect(() => {
      emitirEvento('list.delete', unMensaje(filaListaCruda()))
      emitirEvento(
        'item.delete',
        unMensaje(filaArticuloCruda({ id: 'articulo-1' })),
      )
      emitirEvento(
        'item.delete',
        unMensaje(filaArticuloCruda({ id: 'articulo-2' })),
      )
    }).not.toThrow()

    expect(colecciones.listas.get('lista-1')).toBeUndefined()
    expect(colecciones.articulos.get('articulo-1')).toBeUndefined()
    expect(colecciones.articulos.get('articulo-2')).toBeUndefined()
    expect(alReportar).not.toHaveBeenCalled()
  })

  it('filtering before emitting keeps a concurrent legitimate write inside the same writeBatch', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    colecciones.articulos.utils.writeUpsert(
      filaArticuloComoArticulo(
        filaArticuloCruda({ id: 'articulo-sobreviviente' }),
      ),
    )

    expect(() => {
      colecciones.articulos.utils.writeBatch(() => {
        // `articulo-cascada` was never synced — filtered out before this
        // batch runs, exactly as the D2 guard requires (D3's rationale for
        // why `writeBatch` never throws on the cascade).
        if (estaSincronizado(colecciones.articulos, 'articulo-cascada')) {
          colecciones.articulos.utils.writeDelete('articulo-cascada')
        }
        colecciones.articulos.utils.writeUpdate({
          id: 'articulo-sobreviviente',
          contenido: 'Actualizado por otro dispositivo',
        })
      })
    }).not.toThrow()

    expect(colecciones.articulos.get('articulo-sobreviviente')).toMatchObject({
      contenido: 'Actualizado por otro dispositivo',
    })
  })

  it('a guard based on optimistic presence alone is insufficient (has() vs estaSincronizado() divergence)', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')

    colecciones.articulos.insert(
      filaArticuloComoArticulo(filaArticuloCruda({ id: 'articulo-optimista' })),
    )

    expect(colecciones.articulos.has('articulo-optimista')).toBe(true)
    expect(estaSincronizado(colecciones.articulos, 'articulo-optimista')).toBe(
      false,
    )

    expect(() => {
      colecciones.articulos.utils.writeBatch(() => {
        // A different, already-cascaded key. The optimistic insert above
        // must never make this filter treat it as present.
        if (
          estaSincronizado(colecciones.articulos, 'articulo-cascada-distinto')
        ) {
          colecciones.articulos.utils.writeDelete('articulo-cascada-distinto')
        }
      })
    }).not.toThrow()
  })
})

describe('iniciarSuscripcionHogar — standalone item.delete', () => {
  it('an item.delete for a synced item whose list is still present removes only that item and reports nothing', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    colecciones.listas.utils.writeUpsert(
      filaListaCrudaComoLista(filaListaCruda()),
    )
    colecciones.articulos.utils.writeUpsert(
      filaArticuloComoArticulo(filaArticuloCruda({ id: 'articulo-1' })),
    )
    const alReportar = vi.fn()
    await iniciarSuscripcionHogar('hogar-1', colecciones, alReportar)

    emitirEvento(
      'item.delete',
      unMensaje(filaArticuloCruda({ id: 'articulo-1' })),
    )

    expect(estaSincronizado(colecciones.articulos, 'articulo-1')).toBe(false)
    expect(colecciones.articulos.get('articulo-1')).toBeUndefined()
    expect(colecciones.listas.get('lista-1')).toBeDefined()
    expect(alReportar).not.toHaveBeenCalled()
  })
})

describe('iniciarSuscripcionHogar — D4 cascade ordering on list.delete', () => {
  it('commits the articulos batch before the listas writeDelete and leaves no item of that list behind', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    colecciones.listas.utils.writeUpsert(
      filaListaCrudaComoLista(filaListaCruda()),
    )
    colecciones.articulos.utils.writeUpsert([
      filaArticuloComoArticulo(filaArticuloCruda({ id: 'articulo-1' })),
      filaArticuloComoArticulo(filaArticuloCruda({ id: 'articulo-2' })),
    ])
    const espiaBatchArticulos = vi.spyOn(
      colecciones.articulos.utils,
      'writeBatch',
    )
    const espiaBorradoLista = vi.spyOn(colecciones.listas.utils, 'writeDelete')
    const alReportar = vi.fn()
    await iniciarSuscripcionHogar('hogar-1', colecciones, alReportar)

    emitirEvento('list.delete', unMensaje(filaListaCruda()))

    expect(espiaBatchArticulos).toHaveBeenCalledTimes(1)
    expect(espiaBorradoLista).toHaveBeenCalledTimes(1)
    expect(espiaBatchArticulos.mock.invocationCallOrder[0]).toBeLessThan(
      espiaBorradoLista.mock.invocationCallOrder[0],
    )
    expect(
      Array.from(colecciones.articulos.values()).filter(
        (articulo) => articulo.listaId === 'lista-1',
      ),
    ).toEqual([])
    expect(colecciones.listas.get('lista-1')).toBeUndefined()
    expect(alReportar).not.toHaveBeenCalled()
  })
})

describe('iniciarSuscripcionHogar — detener() teardown contract', () => {
  it('removes the handlers, unsubscribes without disconnecting, and is idempotent', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    const alReportar = vi.fn()
    const { detener } = await iniciarSuscripcionHogar(
      'hogar-1',
      colecciones,
      alReportar,
    )

    detener()

    emitirEvento(
      'list.insert',
      unMensaje(filaListaCruda({ id: 'lista-tras-detener' })),
    )
    expect(colecciones.listas.get('lista-tras-detener')).toBeUndefined()
    expect(realtime.off).toHaveBeenCalledTimes(7)
    expect(realtime.unsubscribe).toHaveBeenCalledTimes(1)
    expect(realtime.unsubscribe).toHaveBeenCalledWith('household:hogar-1')
    expect(realtime.disconnect).not.toHaveBeenCalled()

    expect(() => detener()).not.toThrow()
    expect(realtime.off).toHaveBeenCalledTimes(7)
    expect(realtime.unsubscribe).toHaveBeenCalledTimes(1)
    expect(realtime.disconnect).not.toHaveBeenCalled()
    expect(alReportar).not.toHaveBeenCalled()
  })
})

describe('filaDesdeMensaje — envelope parsing via one narrow adapter', () => {
  it('treats a missing bought_at and an explicit bought_at: null identically', () => {
    const { bought_at: _omitido, ...filaSinBoughtAt } = filaArticuloCruda()
    const mensajeSinCampo = unMensaje(filaSinBoughtAt)
    const mensajeConNull = unMensaje(filaArticuloCruda({ bought_at: null }))

    expect(filaDesdeMensaje(mensajeSinCampo).bought_at).toBeNull()
    expect(filaDesdeMensaje(mensajeConNull).bought_at).toBeNull()
  })

  it('produces the same row data whether meta.senderId is absent or null', () => {
    const mensajeSinSenderId = unMensaje(filaListaCruda())
    const mensajeConSenderIdNull = unMensaje(filaListaCruda(), {
      senderId: null,
    })

    expect(filaDesdeMensaje(mensajeSinSenderId)).toEqual(
      filaDesdeMensaje(mensajeConSenderIdNull),
    )
  })

  it('drops a message failing the meta.messageId shape guard', () => {
    const mensajeIlegible = {
      meta: { messageId: 42, senderType: 'system', timestamp: 't' },
      ...filaListaCruda(),
    } as unknown as SocketMessage

    expect(() => filaDesdeMensaje(mensajeIlegible)).toThrow()
  })

  it('drops a message whose senderType is not system', async () => {
    const queryClient = new QueryClient()
    const colecciones = await construirColecciones(queryClient, 'hogar-1')
    const alReportar = vi.fn()
    await iniciarSuscripcionHogar('hogar-1', colecciones, alReportar)

    emitirEvento(
      'list.insert',
      unMensaje(filaListaCruda({ id: 'lista-de-usuario' }), {
        senderType: 'user',
      }),
    )

    expect(colecciones.listas.get('lista-de-usuario')).toBeUndefined()
    expect(alReportar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'mensaje-ilegible',
        evento: 'list.insert',
      }),
    )
  })
})

// Both helpers below convert a raw fixture row into the shape the domain
// mappers expect for pre-seeding synced state through `writeUpsert` — the
// repositories' own mapping functions are exercised end-to-end by
// `listasRepository.test.ts` / `articulosRepository.test.ts` already.
function filaListaCrudaComoLista(fila: ReturnType<typeof filaListaCruda>) {
  return {
    id: fila.id,
    householdId: fila.household_id,
    nombre: fila.name,
    createdAt: fila.created_at,
    createdBy: fila.created_by,
    updatedAt: fila.updated_at,
    updatedBy: fila.updated_by,
  }
}

function filaArticuloComoArticulo(fila: ReturnType<typeof filaArticuloCruda>) {
  return {
    id: fila.id,
    listaId: fila.list_id,
    householdId: fila.household_id,
    contenido: fila.content,
    comprado: fila.is_bought,
    boughtAt: fila.bought_at as string | null,
    boughtBy: fila.bought_by as string | null,
    createdAt: fila.created_at,
    createdBy: fila.created_by,
    updatedAt: fila.updated_at,
    updatedBy: fila.updated_by,
  }
}
