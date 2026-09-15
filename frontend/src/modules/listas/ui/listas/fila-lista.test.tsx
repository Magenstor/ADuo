import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import { FilaLista } from './fila-lista'
import type { Lista } from '../../domain/lista'

const lista: Lista = {
  id: 'lista-1',
  householdId: 'hogar-1',
  nombre: 'Semanal',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'u-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'u-1',
}

// FilaLista composes EnlaceLista (a `Link`), so it needs the same hand-built
// router harness (copied per-file, per `marco-app-persistencia.test.tsx:54-80`).
function renderizar(renombrar = vi.fn(), eliminar = vi.fn()) {
  const rootRoute = createRootRoute({
    component: () => (
      <ul>
        {<FilaLista lista={lista} renombrar={renombrar} eliminar={eliminar} />}
      </ul>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const utils = render(<RouterProvider router={router} />)
  return { renombrar, ...utils }
}

describe('FilaLista', () => {
  it('renders the row link and a Renombrar control with a min-h-11 touch target', async () => {
    renderizar()

    expect(
      await screen.findByRole('link', { name: 'Semanal' }),
    ).toHaveAttribute('href', '/listas/lista-1')
    const renombrarBtn = screen.getByRole('button', { name: /renombrar/i })
    expect(renombrarBtn.className).toMatch(/\bmin-h-11\b/)
  })

  it('renders an Eliminar trigger passing the eliminar prop through to the row', async () => {
    const eliminar = vi.fn()
    renderizar(vi.fn(), eliminar)

    const eliminarBtn = await screen.findByRole('button', {
      name: /^eliminar$/i,
    })
    expect(eliminarBtn.className).toMatch(/\bmin-h-11\b/)
  })

  it('swaps the name for a controlled input in edit mode', async () => {
    const user = userEvent.setup()
    renderizar()

    await user.click(await screen.findByRole('button', { name: /renombrar/i }))

    expect(screen.getByRole('textbox', { name: /nombre/i })).toHaveValue(
      'Semanal',
    )
    expect(
      screen.queryByRole('link', { name: 'Semanal' }),
    ).not.toBeInTheDocument()
  })

  it('commits the rename on submit and exits edit mode on ok:true', async () => {
    const renombrar = vi.fn().mockResolvedValue({ ok: true, valor: undefined })
    const user = userEvent.setup()
    renderizar(renombrar)

    await user.click(await screen.findByRole('button', { name: /renombrar/i }))
    const input = screen.getByRole('textbox', { name: /nombre/i })
    await user.clear(input)
    await user.type(input, 'Mensual')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    expect(renombrar).toHaveBeenCalledWith('lista-1', 'Mensual')
    // FilaLista does not own the display name: it reflects `lista.nombre`
    // from the parent's live query. Exiting edit mode (the input is gone,
    // the link view returns) is what THIS component owns on ok:true.
    expect(
      await screen.findByRole('link', { name: 'Semanal' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('discards the edit on Escape without calling renombrar, restoring the prior name', async () => {
    const renombrar = vi.fn()
    const user = userEvent.setup()
    renderizar(renombrar)

    await user.click(await screen.findByRole('button', { name: /renombrar/i }))
    const input = screen.getByRole('textbox', { name: /nombre/i })
    await user.clear(input)
    await user.type(input, 'Mensual')
    await user.keyboard('{Escape}')

    expect(renombrar).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('link', { name: 'Semanal' }),
    ).toBeInTheDocument()
  })

  it('keeps edit mode, shows the inline alert, and retains the attempted value on ok:false', async () => {
    const renombrar = vi.fn().mockResolvedValue({
      ok: false,
      error: Object.assign(new Error('nombre inválido'), {
        tipo: 'validation',
      }),
    })
    const user = userEvent.setup()
    renderizar(renombrar)

    await user.click(await screen.findByRole('button', { name: /renombrar/i }))
    const input = screen.getByRole('textbox', { name: /nombre/i })
    await user.clear(input)
    await user.type(input, 'Mensual')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByText('nombre inválido')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /nombre/i })).toHaveValue(
      'Mensual',
    )
  })

  it('carries min-h-11 on the Guardar and Cancelar controls', async () => {
    const user = userEvent.setup()
    renderizar()

    await user.click(await screen.findByRole('button', { name: /renombrar/i }))

    expect(screen.getByRole('button', { name: /guardar/i }).className).toMatch(
      /\bmin-h-11\b/,
    )
    expect(screen.getByRole('button', { name: /cancelar/i }).className).toMatch(
      /\bmin-h-11\b/,
    )
  })
})
