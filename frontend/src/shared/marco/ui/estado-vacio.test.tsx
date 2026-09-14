import { render } from '@testing-library/react'
import { EstadoVacio } from './estado-vacio'

describe('EstadoVacio', () => {
  it('renders `titulo` as a level-2 heading', () => {
    const { getByRole } = render(<EstadoVacio titulo="Sin listas todavía" />)

    expect(
      getByRole('heading', { level: 2, name: 'Sin listas todavía' }),
    ).toBeInTheDocument()
  })

  it('omits the description paragraph when `descripcion` is absent', () => {
    const { queryByText, container } = render(
      <EstadoVacio titulo="Sin listas todavía" />,
    )

    expect(container.querySelector('p')).not.toBeInTheDocument()
    expect(queryByText(/crea tu primera lista/i)).not.toBeInTheDocument()
  })

  it('renders `descripcion` as a paragraph when given', () => {
    const { getByText } = render(
      <EstadoVacio
        titulo="Sin listas todavía"
        descripcion="Crea tu primera lista para empezar."
      />,
    )

    expect(getByText('Crea tu primera lista para empezar.').tagName).toBe('P')
  })

  it('renders `children` in the action slot', () => {
    const { getByRole } = render(
      <EstadoVacio titulo="Sin listas todavía">
        <button type="button">Crear lista</button>
      </EstadoVacio>,
    )

    expect(getByRole('button', { name: 'Crear lista' })).toBeInTheDocument()
  })

  it('does not expose a status role', () => {
    const { queryByRole } = render(<EstadoVacio titulo="Sin listas todavía" />)

    expect(queryByRole('status')).not.toBeInTheDocument()
  })
})
