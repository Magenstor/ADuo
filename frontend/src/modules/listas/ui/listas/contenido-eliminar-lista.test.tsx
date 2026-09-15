import { render, screen } from '@testing-library/react'
import { PointerEventsCheckLevel, userEvent } from '@testing-library/user-event'
import { AlertDialog, AlertDialogContent } from '@/shared/ui/alert-dialog'
import { ContenidoEliminarLista } from './contenido-eliminar-lista'
import type { Lista } from '../../domain/lista'

// Per useListas.test.tsx's boundary-mocking precedent, applied to the public
// barrel: this file only fakes the household/hook seam, never the DOM.
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

function renderizar(eliminar = vi.fn(), alCerrar = vi.fn()) {
  const utils = render(
    // Rendered as a child of AlertDialogContent per design D2 — the only
    // place this component mounts in production.
    <AlertDialog open>
      <AlertDialogContent>
        <ContenidoEliminarLista
          lista={lista}
          eliminar={eliminar}
          alCerrar={alCerrar}
        />
      </AlertDialogContent>
    </AlertDialog>,
  )
  return { eliminar, alCerrar, ...utils }
}

const usuario = () =>
  userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })

describe('ContenidoEliminarLista', () => {
  it('shows a neutral counting state while not ready, never a literal zero', () => {
    useArticulos.mockReturnValue({ ready: false, articulos: [] })
    renderizar()

    const contador = screen.getByRole('status')
    expect(contador).toHaveTextContent(/contando/i)
    expect(contador).not.toHaveTextContent('0')
  })

  it('shows the zero-article wording when ready with no articles', () => {
    useArticulos.mockReturnValue({ ready: true, articulos: [] })
    renderizar()

    expect(
      screen.getByText('Esta lista no tiene artículos.'),
    ).toBeInTheDocument()
  })

  it('shows the singular wording when ready with one article', () => {
    useArticulos.mockReturnValue({ ready: true, articulos: [{ id: 'a' }] })
    renderizar()

    expect(screen.getByText('Se perderá 1 artículo.')).toBeInTheDocument()
  })

  it('shows the plural wording when ready with more than one article', () => {
    useArticulos.mockReturnValue({
      ready: true,
      articulos: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    })
    renderizar()

    expect(screen.getByText('Se perderán 3 artículos.')).toBeInTheDocument()
  })

  it('confirm calls eliminar(lista.id) then alCerrar() on success', async () => {
    useArticulos.mockReturnValue({ ready: true, articulos: [] })
    const eliminar = vi.fn().mockResolvedValue({ ok: true, valor: undefined })
    const alCerrar = vi.fn()
    const user = usuario()
    renderizar(eliminar, alCerrar)

    await user.click(screen.getByRole('button', { name: /eliminar/i }))

    expect(eliminar).toHaveBeenCalledWith('lista-1')
    await vi.waitFor(() => expect(alCerrar).toHaveBeenCalledTimes(1))
  })

  it('cancel calls only alCerrar()', async () => {
    useArticulos.mockReturnValue({ ready: true, articulos: [] })
    const eliminar = vi.fn()
    const alCerrar = vi.fn()
    const user = usuario()
    renderizar(eliminar, alCerrar)

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(eliminar).not.toHaveBeenCalled()
    expect(alCerrar).toHaveBeenCalledTimes(1)
  })

  it('keeps the dialog open and shows an inline alert on ok:false, without calling alCerrar', async () => {
    useArticulos.mockReturnValue({ ready: true, articulos: [] })
    const eliminar = vi.fn().mockResolvedValue({
      ok: false,
      error: Object.assign(new Error('no se pudo eliminar'), {
        tipo: 'persistence',
      }),
    })
    const alCerrar = vi.fn()
    const user = usuario()
    renderizar(eliminar, alCerrar)

    await user.click(screen.getByRole('button', { name: /eliminar/i }))

    expect(await screen.findByText('no se pudo eliminar')).toBeInTheDocument()
    expect(alCerrar).not.toHaveBeenCalled()
  })

  it('disables the confirm control while not ready', () => {
    useArticulos.mockReturnValue({ ready: false, articulos: [] })
    renderizar()

    expect(screen.getByRole('button', { name: /eliminar/i })).toBeDisabled()
  })

  it('carries min-h-11 on the confirm and cancel controls', () => {
    useArticulos.mockReturnValue({ ready: true, articulos: [] })
    renderizar()

    expect(screen.getByRole('button', { name: /eliminar/i }).className).toMatch(
      /\bmin-h-11\b/,
    )
    expect(screen.getByRole('button', { name: /cancelar/i }).className).toMatch(
      /\bmin-h-11\b/,
    )
  })
})
