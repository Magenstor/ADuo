import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { Articulo } from '../../domain/articulo'
import type { Lista } from '../../domain/lista'
import { ListaDetallePage } from './lista-detalle-page'

const {
  useListas,
  useArticulos,
  coincideConBusqueda,
  agregar,
  editar,
  marcar,
  desmarcar,
  eliminar,
  limpiarComprados,
} = vi.hoisted(() => ({
  useListas: vi.fn(),
  useArticulos: vi.fn(),
  coincideConBusqueda: vi.fn((contenido: string, consulta: string) =>
    contenido
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(consulta.toLowerCase()),
  ),
  agregar: vi.fn(),
  editar: vi.fn(),
  marcar: vi.fn(),
  desmarcar: vi.fn(),
  eliminar: vi.fn(),
  limpiarComprados: vi.fn(),
}))

vi.mock('../../application/useListas', () => ({ useListas }))
vi.mock('../../application/useArticulos', () => ({ useArticulos }))
vi.mock('../../domain/busqueda', () => ({ coincideConBusqueda }))

const lista = (id: string, nombre = id): Lista => ({
  id,
  nombre,
  householdId: 'hogar-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'usuario-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'usuario-1',
})

const articulo = (id: string, overrides: Partial<Articulo> = {}): Articulo => ({
  id,
  listaId: 'lista-1',
  householdId: 'hogar-1',
  contenido: id,
  comprado: false,
  boughtAt: null,
  boughtBy: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'usuario-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'usuario-1',
  ...overrides,
})

function montar({
  listas = [lista('lista-1', 'Compra semanal')],
  articulos = [],
}: {
  listas?: Lista[]
  articulos?: Articulo[]
} = {}) {
  useListas.mockReturnValue({ listas, loading: false, error: undefined })
  useArticulos.mockReturnValue({
    articulos,
    loading: false,
    error: undefined,
    agregar,
    editar,
    marcar,
    desmarcar,
    eliminar,
    limpiarComprados,
  })
  return render(<ListaDetallePage listaId="lista-1" />)
}

describe('ListaDetallePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    agregar.mockResolvedValue({ ok: true, valor: 'nuevo' })
    editar.mockResolvedValue({ ok: true, valor: undefined })
    marcar.mockResolvedValue({ ok: true, valor: undefined })
    desmarcar.mockResolvedValue({ ok: true, valor: undefined })
    eliminar.mockResolvedValue({ ok: true, valor: undefined })
    limpiarComprados.mockResolvedValue({ ok: true, valor: {} })
  })

  it('shows the selected list name', () => {
    montar()

    expect(
      screen.getByRole('heading', { name: 'Compra semanal' }),
    ).toBeInTheDocument()
  })

  it('shows no unrelated articles when the selected list is unavailable', () => {
    montar({
      listas: [lista('otra-lista', 'Otra compra')],
      articulos: [articulo('Pan')],
    })

    expect(
      screen.getByText('Esta lista no está disponible.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Pan')).not.toBeInTheDocument()
  })

  it('keeps pending articles before the visible purchased group', () => {
    montar({
      articulos: [
        articulo('Leche'),
        articulo('Pan', { comprado: true }),
        articulo('Huevos'),
      ],
    })

    const pending = screen.getByRole('region', { name: 'Pendientes' })
    const purchased = screen.getByRole('region', { name: 'Comprados' })
    expect(within(pending).getByText('Leche')).toBeInTheDocument()
    expect(within(pending).getByText('Huevos')).toBeInTheDocument()
    expect(within(purchased).getByText('Pan')).toBeInTheDocument()
    expect(
      pending.compareDocumentPosition(purchased) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('clears the add input only when agregar succeeds', async () => {
    const user = userEvent.setup()
    montar()
    const input = screen.getByRole('textbox', { name: 'Añadir artículo' })

    await user.type(input, ' Leche ')
    await user.click(screen.getByRole('button', { name: 'Añadir artículo' }))

    expect(agregar).toHaveBeenCalledWith('Leche')
    expect(input).toHaveValue('')
  })

  it('preserves the add input when agregar fails', async () => {
    agregar.mockResolvedValueOnce({ ok: false, error: new Error('offline') })
    const user = userEvent.setup()
    montar()
    const input = screen.getByRole('textbox', { name: 'Añadir artículo' })

    await user.type(input, 'Leche')
    await user.click(screen.getByRole('button', { name: 'Añadir artículo' }))

    expect(agregar).toHaveBeenCalledWith('Leche')
    expect(input).toHaveValue('Leche')
  })

  it('marks pending articles and unmarks purchased articles', async () => {
    const user = userEvent.setup()
    montar({
      articulos: [articulo('Leche'), articulo('Pan', { comprado: true })],
    })

    await user.click(
      screen.getByRole('button', { name: 'Marcar Leche como comprado' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Desmarcar Pan como comprado' }),
    )

    expect(marcar).toHaveBeenCalledWith('Leche')
    expect(desmarcar).toHaveBeenCalledWith('Pan')
  })

  it('edits one article without changing another row draft', async () => {
    const user = userEvent.setup()
    montar({ articulos: [articulo('Leche'), articulo('Pan')] })

    await user.click(screen.getByRole('button', { name: 'Editar Leche' }))
    const editInput = screen.getByRole('textbox', { name: 'Editar Leche' })
    await user.clear(editInput)
    await user.type(editInput, 'Leche sin lactosa')
    await user.click(screen.getByRole('button', { name: 'Guardar Leche' }))

    expect(editar).toHaveBeenCalledWith('Leche', 'Leche sin lactosa')
    expect(screen.getByText('Pan')).toBeInTheDocument()
  })

  it('deletes only the selected article through an accessible control', async () => {
    const user = userEvent.setup()
    montar({ articulos: [articulo('Leche'), articulo('Pan')] })

    await user.click(screen.getByRole('button', { name: 'Eliminar Leche' }))

    expect(eliminar).toHaveBeenCalledWith('Leche')
    expect(eliminar).not.toHaveBeenCalledWith('Pan')
  })

  it('clears purchased articles only when they exist', async () => {
    const user = userEvent.setup()
    const { rerender } = montar({
      articulos: [articulo('Pan', { comprado: true })],
    })

    await user.click(screen.getByRole('button', { name: 'Limpiar comprados' }))
    expect(limpiarComprados).toHaveBeenCalledTimes(1)

    useArticulos.mockReturnValue({
      articulos: [articulo('Leche')],
      loading: false,
      error: undefined,
      agregar,
      editar,
      marcar,
      desmarcar,
      eliminar,
      limpiarComprados,
    })
    rerender(<ListaDetallePage listaId="lista-1" />)

    expect(
      screen.getByRole('button', { name: 'Limpiar comprados' }),
    ).toBeDisabled()
  })

  it('filters accent-insensitively through local search while preserving groups', async () => {
    const user = userEvent.setup()
    montar({
      articulos: [
        articulo('Azúcar'),
        articulo('Azúcar moreno', { comprado: true }),
        articulo('Pan'),
      ],
    })

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar artículos' }),
      'azucar',
    )

    expect(coincideConBusqueda).toHaveBeenCalledWith('Azúcar', 'azucar')
    expect(screen.getByText('Azúcar')).toBeInTheDocument()
    expect(screen.getByText('Azúcar moreno')).toBeInTheDocument()
    expect(screen.queryByText('Pan')).not.toBeInTheDocument()
    const groups = screen.getAllByRole('region')
    expect(groups[0]).toHaveAccessibleName('Pendientes')
    expect(groups[1]).toHaveAccessibleName('Comprados')
  })

  it('provides large, accessible primary and compact controls', () => {
    montar({ articulos: [articulo('Leche')] })

    expect(screen.getByRole('button', { name: 'Añadir artículo' })).toHaveClass(
      'min-h-11',
    )
    expect(
      screen.getByRole('button', { name: 'Marcar Leche como comprado' }),
    ).toHaveClass('min-h-11', 'min-w-11')
    expect(screen.getByRole('button', { name: 'Editar Leche' })).toHaveClass(
      'min-w-11',
    )
    expect(screen.getByRole('button', { name: 'Eliminar Leche' })).toHaveClass(
      'min-w-11',
    )
  })
})
