import { crearLista } from './lista'
import type { Lista } from './lista'

function datosLista(overrides: Partial<Lista> = {}): Lista {
  return {
    id: 'lista-1',
    householdId: 'hogar-1',
    nombre: 'Compra semanal',
    createdAt: '2026-02-03T04:05:06.789Z',
    createdBy: 'usuario-creador',
    updatedAt: '2026-02-03T05:06:07.890+01:00',
    updatedBy: 'usuario-actualizador',
    ...overrides,
  }
}

function resultadoExitoso(overrides: Partial<Lista> = {}) {
  return { ok: true as const, lista: datosLista(overrides) }
}

describe('crearLista', () => {
  it('returns a newly allocated list with normalized name and preserved metadata', () => {
    const datos = datosLista({ nombre: '  Compra semanal  ' })
    const original = { ...datos }

    const resultado = crearLista(datos)

    expect(resultado).toEqual({
      ok: true,
      lista: {
        id: 'lista-1',
        householdId: 'hogar-1',
        nombre: 'Compra semanal',
        createdAt: '2026-02-03T04:05:06.789Z',
        createdBy: 'usuario-creador',
        updatedAt: '2026-02-03T05:06:07.890+01:00',
        updatedBy: 'usuario-actualizador',
      },
    })
    expect(resultado.ok && resultado.lista).not.toBe(datos)
    expect(datos).toEqual(original)
  })

  it('returns the empty-name result without throwing', () => {
    const datosVacios = datosLista({ nombre: '' })
    const datosSoloEspacios = datosLista({ nombre: ' \t\n\u00a0\uFEFF ' })

    expect(() => crearLista(datosVacios)).not.toThrow()
    expect(crearLista(datosVacios)).toEqual({
      ok: false,
      error: 'nombre-vacio',
    })
    expect(() => crearLista(datosSoloEspacios)).not.toThrow()
    expect(crearLista(datosSoloEspacios)).toEqual({
      ok: false,
      error: 'nombre-vacio',
    })
  })

  it('accepts names with one or eighty Unicode code points', () => {
    const unCaracter = crearLista(datosLista({ nombre: 'A' }))
    const ochentaAscii = crearLista(datosLista({ nombre: 'a'.repeat(80) }))
    const ochentaAstrales = crearLista(datosLista({ nombre: '🛒'.repeat(80) }))
    const ochentaPuntosConMarcas = crearLista(
      datosLista({ nombre: 'e\u0301'.repeat(40) }),
    )

    expect(unCaracter).toEqual(resultadoExitoso({ nombre: 'A' }))
    expect(ochentaAscii).toEqual(resultadoExitoso({ nombre: 'a'.repeat(80) }))
    expect(ochentaAstrales).toEqual(
      resultadoExitoso({ nombre: '🛒'.repeat(80) }),
    )
    expect(ochentaPuntosConMarcas).toEqual(
      resultadoExitoso({ nombre: 'e\u0301'.repeat(40) }),
    )
  })

  it('rejects names longer than eighty Unicode code points', () => {
    const ochentaYUnoAstrales = crearLista(
      datosLista({ nombre: '🛒'.repeat(81) }),
    )
    const ochentaYDosPuntosConMarcas = crearLista(
      datosLista({ nombre: 'e\u0301'.repeat(41) }),
    )

    expect(ochentaYUnoAstrales).toEqual({
      ok: false,
      error: 'nombre-demasiado-largo',
    })
    expect(ochentaYDosPuntosConMarcas).toEqual({
      ok: false,
      error: 'nombre-demasiado-largo',
    })
  })

  it('trims ECMAScript outer whitespace while preserving internal whitespace', () => {
    const resultado = crearLista(
      datosLista({
        nombre: ' \t\n\u00a0\uFEFFCompra \t  semanal\uFEFF\u00a0\n\t ',
      }),
    )

    expect(resultado).toEqual(
      resultadoExitoso({ nombre: 'Compra \t  semanal' }),
    )
  })

  it('permits repeated calls with duplicate normalized names', () => {
    const primera = crearLista(
      datosLista({ id: 'lista-1', nombre: ' Compra ' }),
    )
    const segunda = crearLista(datosLista({ id: 'lista-2', nombre: 'Compra' }))

    expect(primera).toEqual(
      resultadoExitoso({ id: 'lista-1', nombre: 'Compra' }),
    )
    expect(segunda).toEqual(
      resultadoExitoso({ id: 'lista-2', nombre: 'Compra' }),
    )
  })
})
