import {
  desmarcarArticuloComprado,
  marcarArticuloComprado,
  ordenarArticulosPorIncorporacion,
} from './articulo'
import type { Articulo } from './articulo'

function articulo(overrides: Partial<Articulo> = {}): Articulo {
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

describe('marcarArticuloComprado', () => {
  it('returns a new purchased article with the supplied purchase metadata', () => {
    const pendiente = articulo()
    const original = { ...pendiente }

    const comprado = marcarArticuloComprado(
      pendiente,
      '2026-02-03T10:00:00Z',
      'usuario-comprador',
    )

    expect(comprado).toEqual({
      ...original,
      comprado: true,
      boughtAt: '2026-02-03T10:00:00Z',
      boughtBy: 'usuario-comprador',
    })
    expect(comprado).not.toBe(pendiente)
    expect(pendiente).toEqual(original)
  })
})

describe('desmarcarArticuloComprado', () => {
  it('returns a new pending article while clearing both purchase fields', () => {
    const comprado = articulo({
      comprado: true,
      boughtAt: '2026-02-03T10:00:00Z',
      boughtBy: 'usuario-comprador',
    })
    const original = { ...comprado }

    const pendiente = desmarcarArticuloComprado(comprado)

    expect(pendiente).toEqual({
      ...original,
      comprado: false,
      boughtAt: null,
      boughtBy: null,
    })
    expect(pendiente).not.toBe(comprado)
    expect(comprado).toEqual(original)
  })
})

describe('ordenarArticulosPorIncorporacion', () => {
  it('keeps every article while placing pending articles first by incorporation time', () => {
    const purchasedLater = articulo({
      id: 'purchased-later',
      comprado: true,
      boughtAt: '2026-02-03T12:00:00Z',
      boughtBy: 'usuario-comprador',
      createdAt: '2026-02-03T11:00:00Z',
    })
    const pendingLater = articulo({
      id: 'pending-later',
      createdAt: '2026-02-03T10:00:00Z',
    })
    const purchasedEarlier = articulo({
      id: 'purchased-earlier',
      comprado: true,
      boughtAt: '2026-02-03T09:30:00Z',
      boughtBy: 'usuario-comprador',
      createdAt: '2026-02-03T09:00:00Z',
    })
    const pendingEarlier = articulo({
      id: 'pending-earlier',
      createdAt: '2026-02-03T08:00:00Z',
    })
    const articulos = [
      purchasedLater,
      pendingLater,
      purchasedEarlier,
      pendingEarlier,
    ]
    const original = [...articulos]

    const ordenados = ordenarArticulosPorIncorporacion(articulos)

    expect(ordenados).toEqual([
      pendingEarlier,
      pendingLater,
      purchasedEarlier,
      purchasedLater,
    ])
    expect(ordenados).not.toBe(articulos)
    expect(articulos).toEqual(original)
  })

  it('orders offset timestamps by instant and preserves equal-instant order per group', () => {
    const pendingEqualFirst = articulo({
      id: 'pending-equal-first',
      createdAt: '2026-02-03T10:00:00+02:00',
    })
    const pendingEqualSecond = articulo({
      id: 'pending-equal-second',
      createdAt: '2026-02-03T08:00:00Z',
    })
    const pendingLater = articulo({
      id: 'pending-later',
      createdAt: '2026-02-03T09:00:00Z',
    })
    const purchasedEqualFirst = articulo({
      id: 'purchased-equal-first',
      comprado: true,
      boughtAt: '2026-02-03T12:00:00Z',
      boughtBy: 'usuario-comprador',
      createdAt: '2026-02-03T10:00:00+02:00',
    })
    const purchasedEqualSecond = articulo({
      id: 'purchased-equal-second',
      comprado: true,
      boughtAt: '2026-02-03T12:00:00Z',
      boughtBy: 'usuario-comprador',
      createdAt: '2026-02-03T08:00:00Z',
    })
    const purchasedLater = articulo({
      id: 'purchased-later',
      comprado: true,
      boughtAt: '2026-02-03T12:00:00Z',
      boughtBy: 'usuario-comprador',
      createdAt: '2026-02-03T09:00:00Z',
    })
    const articulos = [
      purchasedLater,
      pendingLater,
      purchasedEqualFirst,
      pendingEqualFirst,
      purchasedEqualSecond,
      pendingEqualSecond,
    ]
    const original = structuredClone(articulos)

    const ordenados = ordenarArticulosPorIncorporacion(articulos)

    expect(ordenados).toEqual([
      pendingEqualFirst,
      pendingEqualSecond,
      pendingLater,
      purchasedEqualFirst,
      purchasedEqualSecond,
      purchasedLater,
    ])
    expect(articulos).toEqual(original)
  })

  it('retains duplicate occurrences and returns fresh, non-mutating empty and singleton arrays', () => {
    const duplicado = articulo({ id: 'duplicado' })
    const comprado = articulo({
      id: 'comprado',
      comprado: true,
      boughtAt: '2026-02-03T10:00:00Z',
      boughtBy: 'usuario-comprador',
    })
    const articulos = [comprado, duplicado, duplicado]
    const original = structuredClone(articulos)
    const vacio: Articulo[] = []
    const unico = [duplicado]

    const ordenados = ordenarArticulosPorIncorporacion(articulos)
    const ordenVacio = ordenarArticulosPorIncorporacion(vacio)
    const ordenUnico = ordenarArticulosPorIncorporacion(unico)

    expect(ordenados).toEqual([duplicado, duplicado, comprado])
    expect(ordenados[0]).toBe(duplicado)
    expect(ordenados[1]).toBe(duplicado)
    expect(articulos).toEqual(original)
    expect(ordenVacio).toEqual([])
    expect(ordenVacio).not.toBe(vacio)
    expect(ordenUnico).toEqual([duplicado])
    expect(ordenUnico).not.toBe(unico)
    expect(unico).toEqual([duplicado])
  })
})

describe('purchase transitions under repeated use', () => {
  it('uses latest supplied purchase data and preserves non-purchase data through a round trip', () => {
    const pendiente = articulo({ contenido: 'Pan', updatedBy: 'editor' })
    const original = { ...pendiente }
    const primeraMarca = marcarArticuloComprado(
      pendiente,
      '2026-02-03T10:00:00Z',
      'usuario-uno',
    )
    const segundaMarca = marcarArticuloComprado(
      primeraMarca,
      '2026-02-03T11:00:00Z',
      'usuario-dos',
    )
    const resultado = desmarcarArticuloComprado(
      desmarcarArticuloComprado(segundaMarca),
    )

    expect(segundaMarca).toEqual({
      ...original,
      comprado: true,
      boughtAt: '2026-02-03T11:00:00Z',
      boughtBy: 'usuario-dos',
    })
    expect(resultado).toEqual(original)
    expect(primeraMarca).not.toBe(pendiente)
    expect(segundaMarca).not.toBe(primeraMarca)
    expect(resultado).not.toBe(segundaMarca)
    expect(pendiente).toEqual(original)
  })
})
