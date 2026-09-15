import { render, screen } from '@testing-library/react'
import { PointerEventsCheckLevel, userEvent } from '@testing-library/user-event'
import { EliminarLista } from './eliminar-lista'
import type { Lista } from '../../domain/lista'

// ContenidoEliminarLista (composed for real here, not mocked) calls
// useArticulos internally — same boundary-mock precedent as its own test.
const { useArticulos } = vi.hoisted(() => ({ useArticulos: vi.fn() }))
vi.mock('@/modules/listas', () => ({ useArticulos }))

const lista: Lista = {
  id: 'lista-1',
  householdId: 'hogar-1',
  nombre: 'Semanal',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'u-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'u-1',
}

const usuario = () =>
  userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })

describe('EliminarLista', () => {
  beforeEach(() => {
    useArticulos.mockReturnValue({ ready: true, articulos: [] })
  })

  it('renders an Eliminar trigger with a min-h-11 touch target', () => {
    render(<EliminarLista lista={lista} eliminar={vi.fn()} />)

    const trigger = screen.getByRole('button', { name: /eliminar/i })
    expect(trigger.className).toMatch(/\bmin-h-11\b/)
  })

  it('mounts ContenidoEliminarLista only while the dialog is open', async () => {
    const user = usuario()
    render(<EliminarLista lista={lista} eliminar={vi.fn()} />)

    expect(screen.queryByText(/artículo/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /eliminar/i }))

    expect(
      await screen.findByText('Esta lista no tiene artículos.'),
    ).toBeInTheDocument()
  })

  it('disables the confirm control while articles are not ready', async () => {
    useArticulos.mockReturnValue({ ready: false, articulos: [] })
    const user = usuario()
    render(<EliminarLista lista={lista} eliminar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }))
    await screen.findByRole('status')

    const botones = screen.getAllByRole('button', { name: /^eliminar$/i })
    expect(botones[botones.length - 1]).toBeDisabled()
  })

  it('keeps the dialog open with an inline alert on an ok:false confirm', async () => {
    const eliminar = vi.fn().mockResolvedValue({
      ok: false,
      error: Object.assign(new Error('no se pudo eliminar'), {
        tipo: 'persistence',
      }),
    })
    const user = usuario()
    render(<EliminarLista lista={lista} eliminar={eliminar} />)

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }))
    await screen.findByText('Esta lista no tiene artículos.')
    // Two "Eliminar" buttons now exist (trigger + confirm); the confirm one
    // is inside the dialog content.
    const botones = screen.getAllByRole('button', { name: /^eliminar$/i })
    await user.click(botones[botones.length - 1])

    expect(await screen.findByText('no se pudo eliminar')).toBeInTheDocument()
    expect(
      screen.getByText('Esta lista no tiene artículos.'),
    ).toBeInTheDocument()
  })

  it('closes the dialog on a successful confirm', async () => {
    const eliminar = vi.fn().mockResolvedValue({ ok: true, valor: undefined })
    const user = usuario()
    render(<EliminarLista lista={lista} eliminar={eliminar} />)

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }))
    await screen.findByText('Esta lista no tiene artículos.')
    const botones = screen.getAllByRole('button', { name: /^eliminar$/i })
    await user.click(botones[botones.length - 1])

    await vi.waitFor(() =>
      expect(
        screen.queryByText('Esta lista no tiene artículos.'),
      ).not.toBeInTheDocument(),
    )
  })
})
