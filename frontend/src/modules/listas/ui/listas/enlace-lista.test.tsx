import { render } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import { EnlaceLista } from './enlace-lista'

// Hand-built root route + memory history harness, copied per-file (not
// shared) per `marco-app-persistencia.test.tsx:54-80` — proves the real
// router resolves the link's href without registering the not-yet-existing
// `/listas/$listaId` route (that route belongs to Group B, task 050).
function renderizar(lista: { id: string; nombre: string }) {
  const rootRoute = createRootRoute({
    component: () => <EnlaceLista lista={lista} />,
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('EnlaceLista', () => {
  it("exposes a link whose accessible name is the list's name and targets its detail route", async () => {
    const { findByRole } = renderizar({ id: 'lista-1', nombre: 'Semanal' })

    const enlace = await findByRole('link', { name: 'Semanal' })
    expect(enlace).toHaveAttribute('href', '/listas/lista-1')
  })

  it('resolves a different href for a different list id', async () => {
    const { findByRole } = renderizar({ id: 'lista-2', nombre: 'Fiesta' })

    const enlace = await findByRole('link', { name: 'Fiesta' })
    expect(enlace).toHaveAttribute('href', '/listas/lista-2')
  })

  it('carries the min-h-11 and min-w-11 touch-target classes', async () => {
    const { findByRole } = renderizar({ id: 'lista-3', nombre: 'Oficina' })

    const enlace = await findByRole('link', { name: 'Oficina' })
    expect(enlace.className).toMatch(/\bmin-h-11\b/)
    expect(enlace.className).toMatch(/\bmin-w-11\b/)
  })
})
