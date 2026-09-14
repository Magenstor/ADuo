import {
  actualizarArticulo,
  articuloDesdeFila,
  eliminarArticulo,
  filaDesdeArticulo,
  insertarArticulo,
  obtenerArticulos,
} from './articulosRepository'
import type { FilaArticulo } from './articulosRepository'
import type { Articulo } from '../domain/articulo'

// Mocks our own `@/shared/api/insforge` boundary, following the convention
// established in `shared/hogar/use-sesion.test.ts` and `listasRepository.test.ts`.
const { database } = vi.hoisted(() => ({
  database: { from: vi.fn() },
}))
vi.mock('@/shared/api/insforge', () => ({ insforge: { database } }))

type ResultadoPostgrest = { data: unknown; error: unknown }

// A minimal PostgREST query-builder fake: every filter/write method returns
// the same chainable object and records its call, and the object itself is
// thenable so `await` resolves to the configured result.
function encadenableFalso(resultado: ResultadoPostgrest) {
  const registro: { metodo: string; args: unknown[] }[] = []
  const encadenable: Record<string, unknown> = {
    select: vi.fn((...args: unknown[]) => {
      registro.push({ metodo: 'select', args })
      return encadenable
    }),
    insert: vi.fn((...args: unknown[]) => {
      registro.push({ metodo: 'insert', args })
      return encadenable
    }),
    update: vi.fn((...args: unknown[]) => {
      registro.push({ metodo: 'update', args })
      return encadenable
    }),
    delete: vi.fn((...args: unknown[]) => {
      registro.push({ metodo: 'delete', args })
      return encadenable
    }),
    eq: vi.fn((...args: unknown[]) => {
      registro.push({ metodo: 'eq', args })
      return encadenable
    }),
    then: (
      resolve: (valor: ResultadoPostgrest) => void,
      reject?: (motivo: unknown) => void,
    ) => Promise.resolve(resultado).then(resolve, reject),
  }
  return { encadenable, registro }
}

function articuloCompleto(overrides: Partial<Articulo> = {}): Articulo {
  return {
    id: 'articulo-1',
    listaId: 'lista-1',
    householdId: 'hogar-1',
    contenido: 'Leche',
    comprado: false,
    boughtAt: null,
    boughtBy: null,
    createdAt: '2026-02-03T08:00:00Z',
    createdBy: 'usuario-creador',
    updatedAt: '2026-02-03T08:30:00Z',
    updatedBy: 'usuario-actualizador',
    ...overrides,
  }
}

function filaCompleta(overrides: Partial<FilaArticulo> = {}): FilaArticulo {
  return {
    id: 'articulo-1',
    list_id: 'lista-1',
    household_id: 'hogar-1',
    content: 'Leche',
    is_bought: false,
    bought_by: null,
    bought_at: null,
    created_at: '2026-02-03T08:00:00Z',
    created_by: 'usuario-creador',
    updated_at: '2026-02-03T08:30:00Z',
    updated_by: 'usuario-actualizador',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('articuloDesdeFila / filaDesdeArticulo', () => {
  it('round-trips every field of a fully populated Articulo', () => {
    const original = articuloCompleto({
      comprado: true,
      boughtAt: '2026-02-03T10:00:00Z',
      boughtBy: 'usuario-comprador',
    })

    // Mirrors the real flow: `filaDesdeArticulo` builds the writable
    // payload (audit columns are server-managed), and the echoed row also
    // carries the audit columns the server set.
    const payload = filaDesdeArticulo(original)
    const filaSimulada: FilaArticulo = {
      ...payload,
      id: original.id,
      list_id: original.listaId,
      household_id: original.householdId,
      content: original.contenido,
      is_bought: original.comprado,
      bought_by: original.boughtBy,
      bought_at: original.boughtAt,
      created_at: original.createdAt,
      created_by: original.createdBy,
      updated_at: original.updatedAt,
      updated_by: original.updatedBy,
    }

    expect(articuloDesdeFila(filaSimulada)).toEqual(original)
  })

  it('maps an unpurchased row to all-empty purchase fields', () => {
    const fila = filaCompleta({
      is_bought: false,
      bought_at: null,
      bought_by: null,
    })

    const articulo = articuloDesdeFila(fila)

    expect(articulo.comprado).toBe(false)
    expect(articulo.boughtAt).toBeNull()
    expect(articulo.boughtBy).toBeNull()
  })

  it('maps a purchased row to fully populated purchase fields exactly as read', () => {
    const fila = filaCompleta({
      is_bought: true,
      bought_at: '2026-02-03T10:00:00Z',
      bought_by: 'usuario-comprador',
    })

    const articulo = articuloDesdeFila(fila)

    expect(articulo.comprado).toBe(true)
    expect(articulo.boughtAt).toBe(fila.bought_at)
    expect(articulo.boughtBy).toBe(fila.bought_by)
  })

  it('builds a write payload keyed by content, not contenido', () => {
    const articulo = articuloCompleto({ contenido: 'Pan integral' })

    const payload = filaDesdeArticulo(articulo)

    expect(payload.content).toBe('Pan integral')
    expect(payload).not.toHaveProperty('contenido')
  })
})

describe('obtenerArticulos', () => {
  it('returns Articulo[] with no content, is_bought, or list_id keys on any element', async () => {
    const { encadenable } = encadenableFalso({
      data: [filaCompleta(), filaCompleta({ id: 'articulo-2' })],
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    const articulos = await obtenerArticulos('hogar-1')

    expect(database.from).toHaveBeenCalledWith('shopping_items')
    expect(encadenable.eq).toHaveBeenCalledWith('household_id', 'hogar-1')
    expect(articulos).toEqual([
      articuloCompleto(),
      articuloCompleto({ id: 'articulo-2' }),
    ])
    for (const articulo of articulos) {
      expect(articulo).not.toHaveProperty('content')
      expect(articulo).not.toHaveProperty('is_bought')
      expect(articulo).not.toHaveProperty('list_id')
    }
  })

  it('surfaces a PostgREST error instead of swallowing it', async () => {
    const { encadenable } = encadenableFalso({
      data: null,
      error: new Error('network unreachable'),
    })
    database.from.mockReturnValue(encadenable)

    await expect(obtenerArticulos('hogar-1')).rejects.toThrow(
      'network unreachable',
    )
  })
})

describe('insertarArticulo', () => {
  it('returns an Articulo for a valid creation payload', async () => {
    const nuevo = articuloCompleto()
    const { encadenable } = encadenableFalso({
      data: [filaCompleta()],
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    const resultado = await insertarArticulo(nuevo)

    expect(database.from).toHaveBeenCalledWith('shopping_items')
    expect(encadenable.insert).toHaveBeenCalledWith([
      {
        id: nuevo.id,
        list_id: nuevo.listaId,
        household_id: nuevo.householdId,
        content: nuevo.contenido,
        is_bought: nuevo.comprado,
        bought_by: nuevo.boughtBy,
        bought_at: nuevo.boughtAt,
      },
    ])
    expect(resultado).toEqual(nuevo)
    expect(resultado).not.toHaveProperty('content')
    expect(resultado).not.toHaveProperty('is_bought')
    expect(resultado).not.toHaveProperty('list_id')
  })
})

describe('eliminarArticulo', () => {
  it('issues a hard delete with no soft-delete filter and no filter beyond id', async () => {
    const { encadenable, registro } = encadenableFalso({
      data: null,
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    await eliminarArticulo('articulo-1')

    expect(database.from).toHaveBeenCalledWith('shopping_items')
    expect(encadenable.delete).toHaveBeenCalledWith()
    expect(encadenable.eq).toHaveBeenCalledTimes(1)
    expect(encadenable.eq).toHaveBeenCalledWith('id', 'articulo-1')
    expect(
      registro.some((llamada) => llamada.args.includes('deleted_at')),
    ).toBe(false)
  })

  it('surfaces a PostgREST error instead of swallowing it', async () => {
    const { encadenable } = encadenableFalso({
      data: null,
      error: new Error('row not found'),
    })
    database.from.mockReturnValue(encadenable)

    await expect(eliminarArticulo('articulo-1')).rejects.toThrow(
      'row not found',
    )
  })
})

describe('actualizarArticulo', () => {
  it('returns the updated Articulo filtered by id', async () => {
    const actualizado = articuloCompleto({
      comprado: true,
      boughtAt: '2026-02-03T10:00:00Z',
      boughtBy: 'usuario-comprador',
    })
    const { encadenable } = encadenableFalso({
      data: [
        filaCompleta({
          is_bought: true,
          bought_at: '2026-02-03T10:00:00Z',
          bought_by: 'usuario-comprador',
        }),
      ],
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    const resultado = await actualizarArticulo(actualizado)

    expect(database.from).toHaveBeenCalledWith('shopping_items')
    expect(encadenable.update).toHaveBeenCalledWith({
      id: actualizado.id,
      list_id: actualizado.listaId,
      household_id: actualizado.householdId,
      content: actualizado.contenido,
      is_bought: actualizado.comprado,
      bought_by: actualizado.boughtBy,
      bought_at: actualizado.boughtAt,
    })
    expect(encadenable.eq).toHaveBeenCalledWith('id', actualizado.id)
    expect(resultado).toEqual(actualizado)
  })
})
