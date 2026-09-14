import {
  actualizarLista,
  eliminarLista,
  filaDesdeLista,
  insertarLista,
  listaDesdeFila,
  obtenerListas,
} from './listasRepository'
import type { FilaLista } from './listasRepository'
import type { Lista } from '../domain/lista'

// Mocks our own `@/shared/api/insforge` boundary, following the convention
// established in `shared/hogar/use-sesion.test.ts`: the vendor `@insforge/sdk`
// is never mocked directly, and `insforge.ts` throws at module scope when env
// vars are missing.
const { database } = vi.hoisted(() => ({
  database: { from: vi.fn() },
}))
vi.mock('@/shared/api/insforge', () => ({ insforge: { database } }))

type ResultadoPostgrest = { data: unknown; error: unknown }

// A minimal PostgREST query-builder fake: every filter/write method returns
// the same chainable object and records its call, and the object itself is
// thenable so `await` resolves to the configured result — mirroring how
// `@supabase/postgrest-js` builders behave.
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

function listaCompleta(overrides: Partial<Lista> = {}): Lista {
  return {
    id: 'lista-1',
    householdId: 'hogar-1',
    nombre: 'Compra semanal',
    createdAt: '2026-02-03T04:05:06.789Z',
    createdBy: 'usuario-creador',
    updatedAt: '2026-02-03T05:06:07.890Z',
    updatedBy: 'usuario-actualizador',
    ...overrides,
  }
}

function filaCompleta(overrides: Partial<FilaLista> = {}): FilaLista {
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listaDesdeFila / filaDesdeLista', () => {
  it('round-trips every field of a fully populated Lista', () => {
    const original = listaCompleta()

    // Simulates the real flow: `filaDesdeLista` builds the writable payload
    // (id, household_id, name only — audit columns are server-managed), and
    // the row PostgREST echoes back also carries the audit columns the
    // server set. Merging them back onto the payload models that echo.
    const payload = filaDesdeLista(original)
    const filaSimulada: FilaLista = {
      ...payload,
      created_at: original.createdAt,
      created_by: original.createdBy,
      updated_at: original.updatedAt,
      updated_by: original.updatedBy,
    }

    expect(listaDesdeFila(filaSimulada)).toEqual(original)
  })

  it('builds a write payload keyed by name, not nombre', () => {
    const lista = listaCompleta()

    const payload = filaDesdeLista(lista)

    expect(payload).toEqual({
      id: lista.id,
      household_id: lista.householdId,
      name: lista.nombre,
    })
    expect(payload).not.toHaveProperty('nombre')
  })
})

describe('obtenerListas', () => {
  it('returns Lista[] with no name or household_id keys on any element', async () => {
    const { encadenable } = encadenableFalso({
      data: [filaCompleta(), filaCompleta({ id: 'lista-2' })],
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    const listas = await obtenerListas('hogar-1')

    expect(database.from).toHaveBeenCalledWith('shopping_lists')
    expect(encadenable.eq).toHaveBeenCalledWith('household_id', 'hogar-1')
    expect(listas).toEqual([listaCompleta(), listaCompleta({ id: 'lista-2' })])
    for (const lista of listas) {
      expect(lista).not.toHaveProperty('name')
      expect(lista).not.toHaveProperty('household_id')
    }
  })

  it('surfaces a PostgREST error instead of swallowing it', async () => {
    const { encadenable } = encadenableFalso({
      data: null,
      error: new Error('network unreachable'),
    })
    database.from.mockReturnValue(encadenable)

    await expect(obtenerListas('hogar-1')).rejects.toThrow(
      'network unreachable',
    )
  })
})

describe('insertarLista', () => {
  it('returns a Lista for a valid creation payload', async () => {
    const nueva = listaCompleta()
    const { encadenable } = encadenableFalso({
      data: [filaCompleta()],
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    const resultado = await insertarLista(nueva)

    expect(database.from).toHaveBeenCalledWith('shopping_lists')
    expect(encadenable.insert).toHaveBeenCalledWith([
      { id: nueva.id, household_id: nueva.householdId, name: nueva.nombre },
    ])
    expect(resultado).toEqual(nueva)
    expect(resultado).not.toHaveProperty('name')
    expect(resultado).not.toHaveProperty('household_id')
  })
})

describe('eliminarLista', () => {
  it('issues a hard delete with no soft-delete filter and no filter beyond id', async () => {
    const { encadenable, registro } = encadenableFalso({
      data: null,
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    await eliminarLista('lista-1')

    expect(database.from).toHaveBeenCalledWith('shopping_lists')
    expect(encadenable.delete).toHaveBeenCalledWith()
    expect(encadenable.eq).toHaveBeenCalledTimes(1)
    expect(encadenable.eq).toHaveBeenCalledWith('id', 'lista-1')
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

    await expect(eliminarLista('lista-1')).rejects.toThrow('row not found')
  })
})

describe('actualizarLista', () => {
  it('returns the updated Lista filtered by id', async () => {
    const actualizada = listaCompleta({ nombre: 'Compra quincenal' })
    const { encadenable } = encadenableFalso({
      data: [filaCompleta({ name: 'Compra quincenal' })],
      error: null,
    })
    database.from.mockReturnValue(encadenable)

    const resultado = await actualizarLista(actualizada)

    expect(database.from).toHaveBeenCalledWith('shopping_lists')
    expect(encadenable.update).toHaveBeenCalledWith({
      id: actualizada.id,
      household_id: actualizada.householdId,
      name: actualizada.nombre,
    })
    expect(encadenable.eq).toHaveBeenCalledWith('id', actualizada.id)
    expect(resultado).toEqual(actualizada)
  })
})
