import { render } from '@testing-library/react'
import { EstadoCarga } from './estado-carga'

// Same role/aria convention as `sesion-resuelta.tsx:20-22` — see design D6.
describe('EstadoCarga', () => {
  it('exposes the status role', () => {
    const { getByRole } = render(<EstadoCarga />)

    expect(getByRole('status')).toBeInTheDocument()
  })

  it('shows the default label when none is given', () => {
    const { getByRole } = render(<EstadoCarga />)

    expect(getByRole('status')).toHaveTextContent('Cargando…')
  })

  it('shows a custom label when `etiqueta` is given', () => {
    const { getByRole } = render(<EstadoCarga etiqueta="Guardando…" />)

    expect(getByRole('status')).toHaveTextContent('Guardando…')
  })
})
