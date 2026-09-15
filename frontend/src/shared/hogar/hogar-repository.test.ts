import { resolverHogar } from './hogar-repository'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/shared/api/insforge', () => ({ insforge: { database: { from } } }))

// Fakes one PostgREST builder chain. `range` is a spy so a test can assert
// which window each page read asked for; `then` makes the un-ranged chain
// awaitable exactly like the real builder.
function consulta(resultado: unknown) {
  const range = vi.fn(() => resultado)
  const filtro = {
    limit: vi.fn(() => resultado),
    order: vi.fn(() => filtro),
    range,
    then: (resolver: (valor: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolver),
  }
  return {
    range,
    select: vi.fn(() => ({ eq: vi.fn(() => filtro) })),
  }
}

function filaMiembro(indice: number) {
  return {
    id: `m-${indice}`,
    household_id: 'hogar-1',
    user_id: `u-${indice}`,
    display_name: `Miembro ${indice}`,
  }
}

describe('resolverHogar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps one membership, its household, and only its members', async () => {
    from
      .mockReturnValueOnce(
        consulta({ data: [{ household_id: 'hogar-1' }], error: null }),
      )
      .mockReturnValueOnce(
        consulta({
          data: [{ id: 'hogar-1', name: 'Casa' }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        consulta({
          data: [
            {
              id: 'm-1',
              household_id: 'hogar-1',
              user_id: 'u-1',
              display_name: 'Ana',
            },
          ],
          error: null,
        }),
      )

    await expect(resolverHogar('u-1')).resolves.toEqual({
      estado: 'ready',
      hogar: { id: 'hogar-1', nombre: 'Casa' },
      miembros: [
        { id: 'm-1', householdId: 'hogar-1', userId: 'u-1', nombre: 'Ana' },
      ],
    })
  })

  it('distinguishes no membership from invalid multiple membership', async () => {
    from.mockReturnValueOnce(consulta({ data: [], error: null }))
    await expect(resolverHogar('u-1')).resolves.toEqual({ estado: 'sin-hogar' })

    from.mockReturnValueOnce(
      consulta({
        data: [{ household_id: 'hogar-1' }, { household_id: 'hogar-2' }],
        error: null,
      }),
    )
    await expect(resolverHogar('u-1')).resolves.toMatchObject({
      estado: 'error',
      error: expect.objectContaining({ tipo: 'configuracion' }),
    })
  })

  it('surfaces membership reads as errors rather than an empty household', async () => {
    from.mockReturnValueOnce(
      consulta({ data: null, error: new Error('denied') }),
    )

    await expect(resolverHogar('u-1')).resolves.toMatchObject({
      estado: 'error',
      error: expect.objectContaining({ tipo: 'consulta', message: 'denied' }),
    })
  })

  // The household and member reads run in parallel; each row fails exactly
  // one of them while the other succeeds, so the surfaced message proves
  // which read the error came from rather than "some read failed".
  it.each([
    [
      'household',
      { data: null, error: new Error('household denied') },
      { data: [filaMiembro(1)], error: null },
    ],
    [
      'members',
      { data: [{ id: 'hogar-1', name: 'Casa' }], error: null },
      { data: null, error: new Error('members denied') },
    ],
  ])(
    'surfaces a failed %s read as a query error while the other read succeeds',
    async (read, hogares, miembros) => {
      from
        .mockReturnValueOnce(
          consulta({ data: [{ household_id: 'hogar-1' }], error: null }),
        )
        .mockReturnValueOnce(consulta(hogares))
        .mockReturnValueOnce(consulta(miembros))

      await expect(resolverHogar('u-1')).resolves.toMatchObject({
        estado: 'error',
        error: expect.objectContaining({
          tipo: 'consulta',
          message: `${read} denied`,
        }),
      })
    },
  )

  it('reads every member across page boundaries instead of one bounded page', async () => {
    const primeraPagina = consulta({
      data: Array.from({ length: 100 }, (_, indice) => filaMiembro(indice)),
      error: null,
    })
    const segundaPagina = consulta({
      data: [filaMiembro(100)],
      error: null,
    })
    from
      .mockReturnValueOnce(
        consulta({ data: [{ household_id: 'hogar-1' }], error: null }),
      )
      .mockReturnValueOnce(
        consulta({ data: [{ id: 'hogar-1', name: 'Casa' }], error: null }),
      )
      .mockReturnValueOnce(primeraPagina)
      .mockReturnValueOnce(segundaPagina)

    const resolucion = await resolverHogar('u-1')

    expect(resolucion.estado).toBe('ready')
    if (resolucion.estado !== 'ready') return
    expect(resolucion.miembros).toHaveLength(101)
    expect(resolucion.miembros.at(-1)).toEqual({
      id: 'm-100',
      householdId: 'hogar-1',
      userId: 'u-100',
      nombre: 'Miembro 100',
    })
    expect(primeraPagina.range).toHaveBeenCalledWith(0, 99)
    expect(segundaPagina.range).toHaveBeenCalledWith(100, 199)
  })
})
